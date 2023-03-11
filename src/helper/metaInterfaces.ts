interface CommunicationMeta {
    title: string,
    jsonPath: string,
    name: string | undefined,
}

interface EventsCollectionMeta {
    characterId: string | undefined,
    unitId: string,
    name: string,
    openAt: number,
    thumb: string,
    communications: CommunicationMeta[]
}


function suggestedCommunicationName(communicationMeta: CommunicationMeta) {
    if (communicationMeta.name) {
        return `${communicationMeta.name}-${communicationMeta.title}`
      }
      return `${communicationMeta.title}`
}

export type { EventsCollectionMeta, CommunicationMeta }
export {
    suggestedCommunicationName
}
