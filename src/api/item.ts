import { IItem } from '@/types/pokemon'
import { getEnglish, getName } from '@/utils/parser'
import axios from 'axios'

export const getItemDetail = async (url: string): Promise<IItem> => {
  const { data } = await axios.get(url)
  return {
    id: data.id,
    name: getName(data.names),
    type: data.category.name,
    description:
      data.flavor_text_entries.find(
        (entry: any) =>
          getEnglish(entry.language) && entry.version_group.name === 'emerald',
      ) || {},
    sprite: data.sprites?.default || null,
  }
}
