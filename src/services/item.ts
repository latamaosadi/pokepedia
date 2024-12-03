import type { IItem, INamedResource } from '@/types/pokemon'
import { getEnglish, getName } from '@/utils/parser'

export const getItemDetail = async (url: string): Promise<IItem> => {
  const response = await fetch(url)
  const data = await response.json()
  return {
    id: data.id,
    name: getName(data.names),
    type: data.category.name,
    description:
      data.flavor_text_entries.find(
        (entry: { language: INamedResource; version_group: INamedResource }) =>
          getEnglish(entry.language) && entry.version_group.name === 'emerald',
      ) || {},
    sprite: data.sprites?.default || null,
  }
}
