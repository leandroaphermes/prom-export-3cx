export default class Utils {
  /**
   * Creates a tag with a prefix from an environment variable
   * @param {string} [tagName] - The tag name to be prefixed
   * @returns {string} The prefixed tag
   */
  static createTagWithPrefix(tagName = "") {
    const prefix = process.env.PROM_PREFIX || "promexport3cx";

    // If a prefix exists, combine it with tagName using an underscore, otherwise return tagName alone
    return prefix ? `${prefix}_${tagName}` : tagName;
  }
}
