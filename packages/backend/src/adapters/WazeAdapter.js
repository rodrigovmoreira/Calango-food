class WazeAdapter {
  static generateRouteLink(address) {
    if (!address) return '';
    const encodedAddress = encodeURIComponent(address.trim());
    return `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
  }
}

export default WazeAdapter;