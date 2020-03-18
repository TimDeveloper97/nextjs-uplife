/* eslint-disable @typescript-eslint/no-explicit-any */
export namespace ObjectUtils {
  /**
   * Get a object is filled property values of @param source
   *
   * @param keys A object have properties
   * @param source Source object to get property values
   * @returns default {}
   */
  export const patch = function(keys: any, source: any) {
    if (!keys || !source) return {};
    const data = Object.keys(keys as object).reduce((obj: any, key: any) => {
      obj[key] = (source as any)[key];
      return obj;
    }, {});
    return data;
  };
}
