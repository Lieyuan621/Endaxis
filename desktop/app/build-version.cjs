const versionPattern = /^(\d{4})\.(1[0-2]|[1-9])\.(3[01]|[12]\d|[1-9])-T([01]\d|2[0-3])([0-5]\d)([0-5]\d)$/;

// Use numeric SemVer components for the date and a fixed-width time for same-day builds.
function encodeBuildVersion(date) {
  const beijing = new Date(date.getTime() + 8 * 3_600_000);
  const time = beijing.toISOString().slice(11, 19).replaceAll(':', '');
  return `${beijing.getUTCFullYear()}.${beijing.getUTCMonth() + 1}.${beijing.getUTCDate()}-T${time}`;
}

function versionOrder(version) {
  const [, year, month, day, hour, minute, second] = versionPattern.exec(version);
  return Number(year + month.padStart(2, '0') + day.padStart(2, '0') + hour + minute + second);
}

module.exports = { versionPattern, encodeBuildVersion, versionOrder };
