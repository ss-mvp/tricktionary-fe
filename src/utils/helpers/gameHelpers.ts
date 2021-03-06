import shuffle from 'shuffle-array';
import {
  DoubleNumberDict,
  NumberNumberDict,
  ReactionItem,
} from '../../types/commonTypes';
import {
  DefinitionDictionary,
  DefinitionItem,
  DefinitionResultItem,
  GetReactionsItem,
  GuessItem,
  GuessItemWithConnected,
  LobbyData,
  PlayerDictionary,
  PlayerItem,
  ReactionsDictionary,
  TopPlayers,
} from '../../types/gameTypes';
import finaleText from '../../utils/text/finaleText.json';
import { LARGE_GAME_MINIMUM_PLAYERS, MINIMUM_PLAYERS } from '../constants';
import { getRandomFromArray } from './commonHelpers';

// Check if the number of definitions submitted makes the game "large"
export const isLargeGame = (players: PlayerItem[]): boolean => {
  return (
    players.filter((player) => player.definition !== '').length >=
    LARGE_GAME_MINIMUM_PLAYERS
  );
};

// Check if the game has the required number of players.
export const hasMinimumPlayers = (players: PlayerItem[]): boolean => {
  return players.filter((player) => player.connected).length >= MINIMUM_PLAYERS;
};

// Get a shuffled list of definitions + the correct one for the Host to read
export const getDefinitions = (
  players: PlayerItem[],
  playerId: string,
  definition: string,
): DefinitionItem[] => {
  let definitions = players
    .filter(
      (player: PlayerItem) =>
        player.id !== playerId &&
        isValidPlayer(player) &&
        player.definition.trim() !== '',
    )
    .map((player: PlayerItem) => {
      return {
        content: player.definition,
        id: player.definitionId as number,
        definitionKey: 0,
      };
    });
  definitions.push({ id: 0, content: definition, definitionKey: 0 });
  definitions = shuffle(definitions);
  definitions = definitions.map((definition, idx) => {
    return { ...definition, definitionKey: idx + 1 };
  });
  return definitions;
};

// Get the player's guess from the array of all guesses
export const getPlayerGuess = (
  choices: GuessItem[],
  player: PlayerItem,
): number => {
  const found = choices.find((choice) => choice.player === player.id);
  return found?.guess as number;
};

// Recalculate guesses when players disconnect/reconnect while keeping guesses for all other players
export const recalculateGuessesWithConnected = (
  lobbyData: LobbyData,
  guesses: GuessItem[],
): GuessItemWithConnected[] => {
  const guessDict: any = {};
  const newGuesses: any = [];
  guesses.forEach((guess: any) => {
    guessDict[guess.player] = {
      guess: guess.guess,
      connected: guess.connected,
    };
  });
  lobbyData.players.forEach((player) => {
    if (guessDict.hasOwnProperty(player.id)) {
      guessDict[player.id].connected = player.connected;
    } else {
      guessDict[player.id] = {
        player: player.id,
        guess: -1,
        connected: player.connected,
      };
    }
  });
  for (const playerId in guessDict) {
    if (guessDict[playerId].connected) {
      newGuesses.push({
        player: playerId,
        guess: guessDict[playerId].guess,
        connected: guessDict[playerId].connected,
      });
    }
  }
  return newGuesses;
};

// Return true/false if all Players (not including Host) have made a guess
export const allPlayersHaveGuessed = (
  lobbyData: LobbyData,
  guesses: GuessItemWithConnected[],
): boolean => {
  let all = true;
  const playerGuesses = guesses.filter(
    (guess: GuessItem) => guess.player !== lobbyData.host,
  );
  for (let i = 0; i < playerGuesses.length; i++) {
    if (playerGuesses[i].guess === -1 && playerGuesses[i].connected) {
      all = false;
      break;
    }
  }
  return all;
};

// Create and return TopPlayers object from array lobbyData.topPlayers
export const getTopPlayers = (lobbyData: LobbyData): TopPlayers => {
  const playerDict: { [key: string]: string } = {};
  lobbyData.players.forEach((player) => {
    playerDict[player.id] = player.username;
  });
  return {
    first: {
      username: playerDict[lobbyData.topThree[0]?.user_id],
      definition: lobbyData.topThree[0]?.definition,
      word: lobbyData.topThree[0]?.word,
    },
    second: {
      username: playerDict[lobbyData.topThree[1]?.user_id],
      definition: lobbyData.topThree[1]?.definition,
      word: lobbyData.topThree[1]?.word,
    },
    third: {
      username: playerDict[lobbyData.topThree[2]?.user_id],
      definition: lobbyData.topThree[2]?.definition,
      word: lobbyData.topThree[2]?.word,
    },
  };
};

// Create a list of definitions, attach players who guessed for each, calculate point gains (UI only), add real definiton to the end
export const getSortedDefinitions = (
  lobbyData: LobbyData,
  guesses: GuessItem[],
  playerDict: PlayerDictionary,
): DefinitionResultItem[] => {
  // Create a definition dictionary to easily map all player guesses to each definition
  const definitions: DefinitionDictionary = {};
  lobbyData.players.forEach((player) => {
    if (player.id !== lobbyData.host && isValidPlayer(player)) {
      definitions[player.definitionId as number] = {
        username: player.username,
        playerId: player.id,
        definition: player.definition,
        definitionId: player.definitionId as number,
        guesses: [],
        points: 0,
      };
    }
  });
  // Add real definition
  definitions[0] = {
    username: lobbyData.word,
    playerId: '0',
    definition: lobbyData.definition,
    definitionId: 0,
    guesses: [],
    points: 0,
  };
  // Add player guesses to corresponding definitions and increment points earned
  guesses.forEach((guess) => {
    try {
      definitions[guess.guess].guesses.push(playerDict[guess.player]);
      definitions[guess.guess].points += 1;
    } catch {
      return;
    }
  });
  // Get an array from the result that can be sorted and mapped in JSX
  let definitionArray = Object.values(definitions);
  // Grab the real definition to place at the end after the array is sorted
  const realDefinition = definitionArray.filter(
    (definition) => definition.definitionId === 0,
  );
  // Remove the real definition and sort by point values
  definitionArray = definitionArray
    .filter((definition) => definition.definitionId !== 0)
    .sort((a, b) => (a.points > b.points ? 1 : -1));
  // Add the real definition at the end
  definitionArray.push(...realDefinition);
  return definitionArray;
};

// Generate a dictionary of playerId: username to make getSortedDefinitions more efficient
export const getPlayerDictionary = (
  players: PlayerItem[],
): PlayerDictionary => {
  const dict: PlayerDictionary = {};
  players.forEach((player) => {
    dict[player.id] = player.username;
  });
  return dict;
};

// Create initial dictionary to map reactions of each type to all definitions. { definitionId: { reaction.id: 0, ... } }
export const createReactionsDictionary = (
  players: PlayerItem[],
  reactions: ReactionItem[],
): DoubleNumberDict => {
  const dict: DoubleNumberDict = {};
  const reactionDict: NumberNumberDict = {};
  reactions.forEach((reaction) => {
    reactionDict[reaction.id] = 0;
  });
  players.forEach((player) => {
    if (player.definitionId) {
      dict[player.definitionId] = reactionDict;
    }
  });
  return dict;
};

// Increment reaction and return new lobbyData object
export const addReaction = (
  reactions: ReactionsDictionary,
  definitionId: number,
  reactionId: number,
  value: number,
): ReactionsDictionary => {
  if (
    value &&
    reactions.hasOwnProperty(definitionId) &&
    reactions[definitionId].hasOwnProperty(reactionId)
  ) {
    return {
      ...reactions,
      [definitionId]: {
        ...reactions[definitionId],
        [reactionId]: value,
      },
    };
  }
  return reactions;
};

// Get reaction count with definitionId and reactionId
export const getReactionCount = (
  reactions: DoubleNumberDict,
  definitionId: number,
  reactionId: number,
): number => {
  if (
    reactions?.hasOwnProperty(definitionId) &&
    reactions[definitionId].hasOwnProperty(reactionId)
  ) {
    return reactions[definitionId][reactionId];
  } else {
    return 0;
  }
};

// Update reactions (emoji smash) on refreshing the page with current totals from API
export const updateReactionCounts = (
  prevReactions: ReactionsDictionary,
  reactionsList: GetReactionsItem[],
): ReactionsDictionary => {
  try {
    const newReactions: any = {};
    for (const definition in prevReactions) {
      if (!newReactions.hasOwnProperty(definition)) {
        newReactions[definition] = {};
      }
      for (const reaction in prevReactions[definition] as any) {
        if (!newReactions[definition].hasOwnProperty(reaction)) {
          newReactions[definition][reaction] =
            prevReactions[definition][reaction as any];
        }
      }
    }
    reactionsList.forEach((reaction) => {
      newReactions[reaction.definition_id][reaction.reaction_id] =
        reaction.count;
    });
    return newReactions;
  } catch (err) {
    console.log(err);
    return prevReactions;
  }
};

// Put together semi-randomized string for users with no definition on the Finale podium
export const getFinaleNoDefinitionText = (): string => {
  let text = getRandomFromArray(finaleText.funEmojis);
  text += ' ' + finaleText.noDefinition;
  text += ' ' + getRandomFromArray(finaleText.funWords) + '!';
  return text;
};

// Check if player object has required properties
export const isValidPlayer = (player: PlayerItem): boolean => {
  return (
    player.hasOwnProperty('id') &&
    player.hasOwnProperty('username') &&
    player.hasOwnProperty('definition') &&
    player.hasOwnProperty('points') &&
    player.hasOwnProperty('connected')
  );
};

export const isGhostPlayer = (
  players: PlayerItem[],
  playerId: string,
): boolean => {
  let isGhost = true;
  if (players.length === 0) {
    isGhost = false;
  } else {
    players.forEach((player) => {
      if (player.id === playerId) {
        isGhost = false;
      }
    });
  }
  return isGhost;
};

export const splitSortedDefinitions = (
  sortedDefinitions: DefinitionResultItem[],
): [DefinitionResultItem[], DefinitionResultItem[], DefinitionResultItem] => {
  const filteredDefinitions = sortedDefinitions.filter(
    (definition) => definition.definition.trim() !== '',
  );
  const noVotes = filteredDefinitions.filter(
    (definition) => definition.points === 0 && definition.definitionId !== 0,
  );
  const gotVotes = filteredDefinitions.filter(
    (definition) => definition.points > 0 && definition.definitionId !== 0,
  );
  const realDefinition = filteredDefinitions.filter(
    (definition) => definition.definitionId === 0,
  )[0];
  return [noVotes, gotVotes, realDefinition];
};
