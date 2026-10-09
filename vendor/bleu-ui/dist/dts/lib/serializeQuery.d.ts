/**
 * Serializes an object into a query string. This function handles nested objects, arrays,
 * and primitive data types (strings, numbers, booleans). It encodes keys and values to
 * ensure a valid query string. The function throws an error if the input is not an object.
 *
 * @example
 * // Basic usage
 * const params = { name: 'John', age: 30 };
 * serializeQuery(params);
 * > 'name=John&age=30'
 *
 * @example
 * // Nested objects and arrays
 * const complexParams = {
 *   user: { name: 'John', roles: ['admin', 'user'] },
 *   active: true
 * };
 * serializeQuery(complexParams);
 * > 'user[name]=John&user[roles][]=admin&user[roles][]=user&active=true'
 *
 * @param {Object} params - The object to be serialized into a query string.
 * @param {string} [prefix=""] - A prefix used for nested objects (internal use).
 * @returns {string} - The serialized query string.
 * @throws {Error} - Throws an error if the input is not an object.
 */
export declare function serializeQuery(params?: object | null, prefix?: string): string;
/**
 * Deserializes a query string into an object. This function can handle nested parameters
 * and arrays. It uses URLSearchParams to parse the query string and reconstructs the
 * original object structure. The function throws an error if the input is not a string.
 *
 * @example
 * const queryString = 'user[name]=John&user[roles][]=admin&user[roles][]=user&active=true';
 * deserializeQuery(queryString);
 * > { user: { name: 'John', roles: ['admin', 'user'] }, active: 'true' }
 *
 * @param {string} queryString - The query string to be deserialized into an object.
 * @returns {Object} - The deserialized object.
 * @throws {Error} - Throws an error if the input is not a string.
 */
export declare function deserializeQuery(queryString: string | null): object;
//# sourceMappingURL=serializeQuery.d.ts.map