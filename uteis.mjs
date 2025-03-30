export default class Uteis {
  /**
   * Creates a tag with prefix from environment variable
   * @param {string} [tagName] - The tag name to be prefixed
   * @returns {string} The prefixed tag
   */
  static createTagWithPrefix(tagName = "") {
    const prefix = process.env.PROM_PREFIX || "promexport3cx";

    // If prefix exists, combine it with tagName using underscore, otherwise return tagName alone
    return prefix ? `${prefix}_${tagName}` : tagName;
  }
}
