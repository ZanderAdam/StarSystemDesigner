/**
 * Elite Dangerous style naming system for celestial bodies
 */

export class SystemNaming {
  /**
   * Generate star ID - primary star gets system name, companions get letters
   * Sol, Sol A, Sol B, Sol C...
   */
  static generateStarId(systemName: string, starIndex: number = 0): string {
    if (starIndex === 0) return systemName;
    return `${systemName} ${String.fromCharCode(65 + starIndex - 1)}`;
  }

  /**
   * Generate planet ID - numbered from inner to outer orbit
   * Sol 1, Sol 2, Sol 3...
   * For companion stars: Sol B 1, Sol B 2...
   */
  static generatePlanetId(
    systemName: string,
    starId: string,
    planetNumber: number
  ): string {
    const starSuffix = starId === systemName ? '' : ` ${starId.split(' ').slice(1).join(' ')}`;
    return `${systemName}${starSuffix} ${planetNumber}`;
  }

  /**
   * Generate moon ID - lettered from largest/closest
   * Sol 3 a, Sol 3 b, Sol 3 c...
   */
  static generateMoonId(planetId: string, moonIndex: number): string {
    return `${planetId} ${String.fromCharCode(97 + moonIndex)}`;
  }

  /**
   * Generate asteroid belt ID
   * Sol Belt 1, Sol Belt 2...
   */
  static generateAsteroidId(systemName: string, beltIndex: number): string {
    return `${systemName} Belt ${beltIndex}`;
  }

  /**
   * Generate station ID - by type and location
   * Sol 3 Research 1, Sol 3 a Mining 1...
   */
  static generateStationId(
    parentId: string,
    stationType: string,
    stationIndex: number
  ): string {
    const capitalizedType = stationType.charAt(0).toUpperCase() + stationType.slice(1);
    return `${parentId} ${capitalizedType} ${stationIndex}`;
  }

  /**
   * Parse a celestial ID to extract components
   */
  static parseId(id: string): {
    systemName: string;
    starLetter?: string;
    planetNumber?: number;
    moonLetter?: string;
    stationType?: string;
    stationIndex?: number;
  } {
    const parts = id.split(' ');
    const result: ReturnType<typeof SystemNaming.parseId> = {
      systemName: parts[0],
    };

    if (parts.length === 1) return result;

    // Check for star letter (A, B, C)
    if (parts[1].length === 1 && /^[A-Z]$/.test(parts[1])) {
      result.starLetter = parts[1];
      parts.splice(1, 1);
    }

    // Check for planet number
    const planetMatch = parts[1]?.match(/^\d+$/);
    if (planetMatch) {
      result.planetNumber = parseInt(parts[1], 10);

      // Check for moon letter
      if (parts[2]?.length === 1 && /^[a-z]$/.test(parts[2])) {
        result.moonLetter = parts[2];
      }

      // Check for station
      if (parts[2] && !result.moonLetter) {
        const stationTypes = ['Research', 'Mining', 'Military', 'Trade', 'Ring'];
        if (stationTypes.includes(parts[2])) {
          result.stationType = parts[2].toLowerCase();
          result.stationIndex = parseInt(parts[3], 10);
        }
      }
    }

    return result;
  }
}
