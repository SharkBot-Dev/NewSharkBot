export interface ModuleSetting {
  id: string
  name: string
  description: string
  enabled: boolean
}

export const modules = new Map<string, ModuleSetting>([
  [
    "test", 
    {
      id: "test",
      name: "テストモジュール",
      description: "テストモジュールです",
      enabled: false
    }
  ],
]);