"""Shared checks for live and pinned catalog observations."""
import datetime
import re

ADDRESS = re.compile(r"0x[0-9a-fA-F]{40}")
# The handler can truncate prices with more than 18 decimals to zero.
MAX_ORACLE_DECIMALS = 18
MAX_INT256 = (1 << 255) - 1


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def integer(value, minimum, maximum=None):
    return type(value) is int and value >= minimum and (maximum is None or value <= maximum)


def round_number(value):
    if isinstance(value, str) and value.isascii() and value.isdecimal():
        return int(value)
    return value if type(value) is int else 0


def no_check_errors(record, *, strict=False):
    if not isinstance(record, dict):
        return False
    for field, value in record.items():
        key = field.lower()
        if key.endswith(("error", "errors", "issues")) and (value or (strict and key.endswith("error"))):
            return False
        if strict and key.startswith("skip") and value:
            return False
    return not strict or record.get("status", "checked") == "checked"


def approval_key(approval):
    require(isinstance(approval, dict), "Invalid observation approval")
    chain, address, quote = (approval.get(field) for field in ("chainId", "tokenAddress", "quote"))
    require(integer(chain, 1) and isinstance(address, str) and ADDRESS.fullmatch(address) and quote in ("USD", "ETH"), "Invalid observation chain/token/quote")
    return chain, address.lower(), quote


def approval_pin(approval, *, buy=False):
    chain, address, quote = approval_key(approval)
    pin = {
        "chainId": chain, "tokenAddress": address, "quote": quote,
        "path": approval["path"], "proxyAddress": approval["proxyAddress"].lower(),
        "expectedDescription": approval["expectedDescription"], "expectedDecimals": approval["expectedDecimals"],
        "maxAgeSeconds": approval["maxAgeSeconds"],
    }
    if buy and "snapshotFingerprint" in approval:
        pin["snapshotFingerprint"] = approval["snapshotFingerprint"]
    return pin


def source_rows(approval, inventories):
    return [
        feed for feed in inventories.get(str(approval["chainId"]), [])
        if isinstance(feed, dict) and feed.get("path") == approval["path"]
        and nonempty(feed.get("proxyAddress")) and feed["proxyAddress"].lower() == approval["proxyAddress"].lower()
    ]


def checked_at(value):
    require(nonempty(value), "Missing observation checkedAt")
    try:
        timestamp = datetime.datetime.fromisoformat(value)
    except ValueError as error:
        raise ValueError("Invalid observation checkedAt") from error
    require(timestamp.utcoffset() == datetime.timedelta(0), "Invalid observation checkedAt: expected UTC")


def validate_observations(identity, feed, approval, verification, chain, *, strict=False):
    token = chain.get("tokens", {}).get(identity["address"].lower(), {})
    observed = chain.get("feeds", {}).get(approval["proxyAddress"].lower(), {})
    require(chain.get("issues") == [] and all(no_check_errors(record, strict=strict) for record in (verification, chain, token, observed)), "Verification contains errors or issues")
    token_decimals = token.get("decimals")
    require(token_decimals == identity["decimals"] and token.get("symbol") == identity["symbol"] and (not strict or integer(token_decimals, 0, 36)), "Token verification metadata differs")
    if "robinhoodStockToken" in identity:
        require(token.get("uid") == identity["robinhoodStockToken"]["uid"], "Token issuer UID differs")
    round_id, answered_in_round = round_number(observed.get("roundId")), round_number(observed.get("answeredInRound"))
    require(round_id > 0 and answered_in_round >= round_id, "Incomplete verified feed round")
    require(observed.get("description") == approval["expectedDescription"], "Feed description differs")
    decimals = observed.get("decimals")
    require(decimals == approval["expectedDecimals"] == feed["decimals"] and (not strict or integer(decimals, 0, MAX_ORACLE_DECIMALS)), "Feed decimals differ")
    answer = observed.get("answer")
    try:
        answer = round_number(answer) if strict else int(answer)
    except (ValueError, TypeError):
        answer = 0
    require(answer > 0, "Feed answer must be positive")
    updated, timestamp = observed.get("updatedAt"), observed.get("observedAt")
    require(integer(updated, 1) and integer(timestamp, 1) and updated <= timestamp, "Invalid feed timestamps")
    if strict:
        # The handler scales the answer to 18 decimals, then multiplies the numerator by 10^18.
        require(answer * 10 ** (36 - decimals) <= MAX_INT256, "Scaled feed answer exceeds int256")
        require(approval["maxAgeSeconds"] < updated, "Feed freshness limit can underflow timestamp subtraction")
    age = timestamp - updated
    observed_age = observed.get("ageSeconds")
    require(age <= approval["maxAgeSeconds"] and observed_age == age and (not strict or integer(observed_age, 0)), "Feed snapshot exceeds maxAgeSeconds")
    heartbeat = observed.get("heartbeat")
    require(heartbeat == feed["heartbeat"] and (not strict or integer(heartbeat, 1)), "Feed heartbeat differs")


def validate_leg(leg, identity, feed, approval, *, buy=False):
    require(no_check_errors(leg, strict=True), f"Verification failed: {leg.get('error', 'read was skipped or had issues') if isinstance(leg, dict) else 'missing leg'}")
    pin = leg.get("approval")
    approval_key(pin)
    require(pin == approval_pin(approval, buy=buy) and integer(pin.get("expectedDecimals"), 0, MAX_ORACLE_DECIMALS) and integer(pin.get("maxAgeSeconds"), 1), "Verification does not match exact approval")
    chain = leg.get("observation")
    require(isinstance(chain, dict) and integer(chain.get("chainId"), 1) and chain["chainId"] == approval["chainId"], "Verification chain ID differs")
    for collection, address in (("tokens", pin["tokenAddress"]), ("feeds", pin["proxyAddress"])):
        records = chain.get(collection)
        require(isinstance(records, dict) and set(records) == {address}, f"Verification does not cover exactly the expected {collection}")
    validate_observations(identity, feed, approval, leg, chain, strict=True)
