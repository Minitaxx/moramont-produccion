export interface ProductCatalogItem {
  id: string
  code: string
  name: string
  productType: string
  geometryType: string
}

export interface ProcessTypeItem {
  id: string
  code: string
  name: string
  description: string | null
  active: boolean
}

export interface MachineItem {
  id: string
  code: string
  name: string
  active: boolean
}

export interface ProcessMaterialItem {
  id: string
  processId: string
  materialId: string
  materialName: string | null
  quantity: number
  unit: string
}

export interface ManufacturingProcessItem {
  id: string
  catalogProductId: string
  processTypeId: string
  processTypeName: string
  processTypeCode: string
  order: number
  machineId: string | null
  machineName: string | null
  machineCode: string | null
  estimatedMinutes: number | null
  notes: string | null
  materials: ProcessMaterialItem[]
}
