export enum NeedCriticality {
  NORMAL = 0, // 100 bis -999: Bedürfnis ist erfüllt oder nur leicht unerfüllt
  CONCERNING = 1, // -1000 bis -9999: Bedürfnis unerfüllt, aber nicht kritisch
  CRITICAL = 2, // -10000 bis -49999: Bedürfnis erfordert sofortige Aufmerksamkeit
  LIFE_THREATENING = 3, // -50000 und niedriger: Überlebensgefährdend
}
