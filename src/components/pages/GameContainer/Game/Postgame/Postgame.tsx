import React, { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue, useResetRecoilState } from 'recoil';
import { useLocalStorage } from '../../../../../hooks';
import {
  lobbyState,
  playerGuessState,
  revealResultsState,
  showNewHostModalState,
} from '../../../../../state';
import {
  DefinitionResultItem,
  GuessItem,
  PlayerDictionary,
} from '../../../../../types/gameTypes';
import {
  getPlayerDictionary,
  getSortedDefinitions,
} from '../../../../../utils/helpers';
import { initialToken } from '../../../../../utils/localStorageInitialValues';
import { Host } from '../../../../common/Host';
import { Modal } from '../../../../common/Modal';
import { Player } from '../../../../common/Player';
import { PlayerList } from '../../../../common/PlayerList';
import { SetHost } from '../../../../common/SetHost';
import { DefinitionResult } from './DefinitionResult';

const Postgame = (props: PostgameProps): React.ReactElement => {
  const {
    handlePlayAgain,
    handleSetHost,
    handleRevealResults,
    handleSetFinale,
  } = props;
  const resetGuess = useResetRecoilState(playerGuessState);
  const [showNewHostModal, setShowNewHostModal] = useRecoilState(
    showNewHostModalState,
  );
  const lobbyData = useRecoilValue(lobbyState);
  const revealResults = useRecoilValue(revealResultsState);
  const [playerDict] = useState<PlayerDictionary>(
    getPlayerDictionary(lobbyData.players),
  );
  const [guesses, , reloadGuesses] = useLocalStorage('guesses', initialToken);
  const [sortedDefinitions, setSortedDefinitions] = useState<
    DefinitionResultItem[]
  >(getSortedDefinitions(lobbyData, guesses as GuessItem[], playerDict));

  // Reset player's guess for next round
  useEffect(() => {
    resetGuess();
  }, []);

  // Create new sorted definitions array when player recieves guesses from host
  useEffect(() => {
    setSortedDefinitions(
      getSortedDefinitions(
        lobbyData,
        reloadGuesses() as GuessItem[],
        playerDict,
      ),
    );
  }, [lobbyData, revealResults]);

  return (
    <div className="postgame game-page">
      <h2>It’s Time for the Results!</h2>
      <Host>
        {!revealResults && (
          // Hide after reveal
          <p>
            Players can’t see the results yet, so it’s up to you to read them
            with pizzaz! Say, “Remember, you get one point if you vote for the
            right definition and 1 point if yours ensnares someone else&apos;s
            vote. Let&apos;s reveal the results.
          </p>
        )}
        <p className="word-display">{lobbyData.word}</p>
        <div className="round-results">
          {sortedDefinitions.map((definitionResult, key) => (
            <DefinitionResult key={key} definitionResult={definitionResult} />
          ))}
        </div>
        <div className="endgame-container">
          {!revealResults ? (
            // Before reveal
            <>
              <button onClick={() => handleRevealResults(guesses)}>
                Reveal Results
              </button>
            </>
          ) : (
            // After reveal
            <div className="after-reveal">
              <div className="after-container">
                <button onClick={handleSetFinale}>Go to Finale</button>
                <SetHost
                  players={lobbyData.players}
                  handleSetHost={handleSetHost}
                />
                <Modal
                  header={'Host Changed'}
                  message={'You are now the Host.'}
                  visible={showNewHostModal}
                  handleConfirm={() => setShowNewHostModal(false)}
                />
              </div>
              <button className="play-again" onClick={handlePlayAgain}>
                Play Again
              </button>
            </div>
          )}
        </div>
      </Host>
      <Player>
        {!revealResults ? (
          // Before reveal
          <>
            <p>
              Your host is now going to read the results! Did you guess the
              right one? How did your definition do? Did it reign supreme?
            </p>
            <p className="word-display">{lobbyData.word}</p>
          </>
        ) : (
          // After reveal
          <>
            <p className="word-display">{lobbyData.word}</p>
            <div className="round-results">
              {sortedDefinitions.map((definitionResult, key) => (
                <DefinitionResult
                  key={key}
                  definitionResult={definitionResult}
                />
              ))}
            </div>
          </>
        )}
      </Player>
      <PlayerList hidePoints={!revealResults} />
    </div>
  );
};

export default Postgame;

interface PostgameProps {
  handlePlayAgain: () => void;
  handleSetHost: (hostId: string, guesses: GuessItem[]) => void;
  handleSetFinale: () => void;
  handleRevealResults: (guesses: GuessItem[]) => void;
}
