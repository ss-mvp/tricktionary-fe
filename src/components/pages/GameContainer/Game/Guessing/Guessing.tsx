import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import shuffle from 'shuffle-array';
import { useLocalStorage } from '../../../../../hooks';
import { lobbyState, playerGuessState } from '../../../../../state';
import {
  DefinitionItem,
  DefinitionSelection,
  GuessItem,
  HandleSelectGuessParams,
  PlayerItem,
} from '../../../../../types/gameTypes';
import { MAX_NOTES_LENGTH } from '../../../../../utils/constants';
import { isLargeGame } from '../../../../../utils/helpers';
import { CharCounter } from '../../../../common/CharCounter';
import { Host } from '../../../../common/Host';
import { PlayerStepTwo } from '../../../../common/Instructions';
import { Modal } from '../../../../common/Modal';
import { Player } from '../../../../common/Player';
import { PlayerList } from '../../../../common/PlayerList';

// Non-state functions

// Get a shuffled list of definitions + the correct one
const getDefinitions = (
  players: PlayerItem[],
  playerId: string,
  definition: string,
) => {
  let definitions = players
    .filter(
      (player: PlayerItem) =>
        player.id !== playerId && player.definition !== '',
    )
    .map((player: PlayerItem) => {
      return {
        content: player.definition,
        id: player.definitionId,
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

const getPlayerGuess = (choices: GuessItem[], player: PlayerItem): number => {
  const found = choices.find((choice) => choice.player === player.id);
  return found?.guess as number;
};

// Components

const Guessing = (props: GuessingProps): React.ReactElement => {
  const { playerId, handleSubmitGuesses, handleSendGuess } = props;
  const lobbyData = useRecoilValue(lobbyState);
  const playerGuess = useRecoilValue(playerGuessState);
  // Call getDefinitions to set state. Invoking getDefinitions outside of state causes re-shuffling of the list on selection
  const [definitions] = useState(
    getDefinitions(lobbyData.players, playerId, lobbyData.definition),
  );
  const [guesses, setGuesses] = useLocalStorage(
    'guesses',
    lobbyData.players.map((player) => {
      return { player: player.id, guess: -1, connected: player.connected };
    }),
  );
  const [showModal, setShowModal] = useState(false);
  const [showGuesses, setShowGuesses] = useState(false);
  const [notes, setNotes] = useState('');

  const allPlayersHaveGuessed = () => {
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

  // Recalculate guesses when players disconnect/reconnect while keeping guesses for all other players
  useEffect(() => {
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
    setGuesses(newGuesses);
  }, [lobbyData]);

  const handleSelectGuess = (
    playerId: string,
    guessId: number,
    definitionSelection: DefinitionSelection,
  ) => {
    handleSendGuess(playerId, definitionSelection);
    setGuesses(
      guesses.map((guess: GuessItem) => {
        if (guess.player === playerId) {
          return { ...guess, guess: guessId };
        } else {
          return guess;
        }
      }),
    );
  };

  const handleSubmit = () => {
    if (allPlayersHaveGuessed()) {
      handleSubmitGuesses(guesses);
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="guessing game-page">
      <Host>
        {!showGuesses && (
          // Showing definitions
          <>
            <h2>Read Each Number and Its Definition</h2>
            <p>
              The contestants have submitted their trick definitions. Now you
              need to summon your best gameshow host voice and read the number
              and definition from the list below. Once you finish, read through
              the same numbered list AGAIN.
            </p>
            <p className="word-display">{lobbyData.word}</p>
            <div className="definitions">
              <h3>Definitions</h3>
              {definitions.map((definition, key) => (
                <div key={key} className="definition">
                  <div className="definition-key">
                    <p>#{definition.definitionKey}</p>
                  </div>
                  <p>{definition.content}</p>
                </div>
              ))}
              <button
                className="submit-guesses"
                onClick={() => setShowGuesses(true)}
              >
                Start Voting
              </button>
            </div>
          </>
        )}
        {showGuesses && (
          // Showing votes
          <>
            <h2>It’s Time to Vote!</h2>
            <p>
              Call on each contestant and ask for the number of their vote.
              Input their selection and confirm by reading the definition aloud.
              Example: &quot;Number 3, the squishy remains of rotten
              fruit.&quot;
            </p>
            <p className="word-display">{lobbyData.word}</p>
            <div className="guesses">
              <h3>Player Guesses</h3>
              <div className="voting-label">
                <h3>Name:</h3>
                <h3>Vote:</h3>
              </div>
              <hr />
              {lobbyData.players
                .filter(
                  (player) => player.id !== lobbyData.host && player.connected,
                )
                .map((player, key) => (
                  <Guess
                    key={key}
                    definitions={definitions as DefinitionItem[]}
                    player={player}
                    handleSelectGuess={handleSelectGuess}
                    guesses={guesses}
                  />
                ))}
              <button className="submit-guesses" onClick={handleSubmit}>
                Submit Guesses
              </button>
            </div>
          </>
        )}
        <Modal
          header={'Continue?'}
          message={`You haven't selected a guess for every player. Continue anyway?`}
          handleConfirm={() => handleSubmitGuesses(guesses)}
          handleCancel={() => setShowModal(false)}
          visible={showModal}
        />
      </Host>
      <Player>
        <h2>It’s Time to Vote</h2>
        <PlayerStepTwo />
        <p className="word-display">{lobbyData.word}</p>
        <div className="player-guess">
          <h3>Your guess:</h3>
          {playerGuess.key > 0 ? (
            <div className="definition">
              <div className="definition-key">
                <p>#{playerGuess.key}</p>
              </div>
              <p>{playerGuess.definition}</p>
            </div>
          ) : (
            <p>No Guess yet</p>
          )}
        </div>
        <div className="notes">
          <h3>Listen to the definitions.</h3>
          <p>Take some notes!</p>
          <div className="char-counter-wrapper max-width-35-center">
            <textarea
              maxLength={MAX_NOTES_LENGTH}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <CharCounter string={notes} max={MAX_NOTES_LENGTH} />
          </div>
        </div>
      </Player>
      <PlayerList />
    </div>
  );
};

const Guess = (props: GuessProps): React.ReactElement => {
  const { player, definitions, handleSelectGuess, guesses } = props;
  const { players } = useRecoilValue(lobbyState);

  const handleSelectWithOptions = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value !== 'none') {
      const params: HandleSelectGuessParams = JSON.parse(e.target.value);
      handleSelectGuess(
        params.playerId,
        params.guessId,
        params.definitionSelection,
      );
    }
  };

  const chosenDefinition = definitions.filter(
    (definition) => definition.id === getPlayerGuess(guesses, player),
  )[0]?.content;

  return (
    <>
      <div className="guess">
        <p className="guess-name">{player.username}</p>
        {!isLargeGame(players) ? (
          // Use button display for small games
          definitions.map((definition, key) => (
            <button
              className={`${
                getPlayerGuess(guesses, player) === definition.id
                  ? 'selected'
                  : ''
              }`}
              onClick={() =>
                handleSelectGuess(player.id, definition.id, {
                  key: definition.definitionKey,
                  definition: definition.content,
                })
              }
              key={key}
            >
              {definition.definitionKey}
            </button>
          ))
        ) : (
          // Use select/option display for large games
          <select
            name="guess-select"
            id="guess-select"
            onChange={handleSelectWithOptions}
          >
            {
              // show default "None" option until an option is picked
              !chosenDefinition && <option value="none">None</option>
            }
            {definitions.map((definition, key) => (
              <option
                value={JSON.stringify({
                  playerId: player.id,
                  guessId: definition.id,
                  definitionSelection: {
                    key: definition.definitionKey,
                    definition: definition.content,
                  },
                })}
                key={key}
              >
                {definition.definitionKey}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="show-guess">
        {chosenDefinition && (
          <div>
            <p>Chosen Definition: </p>
            <p className="guess-choice">{chosenDefinition}</p>
          </div>
        )}
      </div>
      <hr />
    </>
  );
};

export default Guessing;

interface GuessingProps {
  handleSubmitGuesses: (guesses: GuessItem[]) => void;
  handleSendGuess: (
    playerId: string,
    definitionSelection: DefinitionSelection,
  ) => void;
  playerId: string;
}

interface GuessProps {
  handleSelectGuess: (
    playerId: string,
    guessId: number,
    definitionSelection: DefinitionSelection,
  ) => void;
  definitions: DefinitionItem[];
  player: PlayerItem;
  guesses: GuessItem[];
}
