export function getTypeInfo(type) {
  switch (type) {
    case "cardio_continuous":
      return { label: "Cardio", color: 0x4CAF50 }
    case "intervals":
      return { label: "Intervalos", color: 0xFF9800 }
    case "free":
      return { label: "Libre", color: 0x58D0FF }
    case "strength":
      return { label: "Fuerza", color: 0xE040FB }
    case "recovery":
      return { label: "Recuperacion", color: 0x5BE7A9 }
    default:
      return { label: "Entreno", color: 0x888888 }
  }
}
