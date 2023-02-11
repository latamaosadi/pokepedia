import axios from 'axios'

export const PokeAPIClient = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
})
