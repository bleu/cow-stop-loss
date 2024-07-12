import useSWR from "swr";

const DRAFT_ORDERS_KEY = "draftOrders";

const getDraftOrders = () => {
  const stored = localStorage.getItem(DRAFT_ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const setDraftOrders = (orders) => {
  localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(orders));
};

export const useDraftOrders = () => {
  const { data: draftOrders, mutate } = useSWR(
    DRAFT_ORDERS_KEY,
    getDraftOrders,
  );

  const addDraftOrder = async (order) => {
    const updatedOrders = [...(draftOrders || []), order];
    await mutate(updatedOrders, false);
    setDraftOrders(updatedOrders);
  };

  const removeDraftOrder = async (id) => {
    const updatedOrders = (draftOrders || []).filter(
      (order) => order.id !== id,
    );
    await mutate(updatedOrders, false);
    setDraftOrders(updatedOrders);
  };

  return {
    draftOrders: draftOrders || [],
    addDraftOrder,
    removeDraftOrder,
    isLoading: !draftOrders,
  };
};
