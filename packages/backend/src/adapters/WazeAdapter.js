class WazeAdapter {
  /**
   * Transforma um endereço em um link de navegação direta.
   */
  static generateRouteLink(address) {
    if (!address) return '';
    const encodedAddress = encodeURIComponent(address.trim());
    return `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
  }
}

export default WazeAdapter;