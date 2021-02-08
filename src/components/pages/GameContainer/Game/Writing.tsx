import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { lobbyState } from '../../../../state';
import { Host } from '../../../common/Host';
import { Modal } from '../../../common/Modal';
import { Player } from '../../../common/Player';
import Timer from '../../../common/Timer/Timer';
import { PlayerList } from '../Game';

// simple definition validation
const definitionIsValid = (definition: string): boolean => {
  return definition.trim().length > 0 && definition.trim().length <= 250;
};

const Writing = (props: WritingProps): React.ReactElement => {
  const lobbyData = useRecoilValue(lobbyState);
  const [definition, setDefinition] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleChangeDefinition = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefinition(e.target.value);
  };

  const handleGoToNextPhase = () => {
    if (timerDone) {
      props.handleSetPhase('GUESSING');
    } else {
      setShowModal(true);
    }
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement> | null,
    definition: string,
  ) => {
    if (e) {
      e.preventDefault();
    }
    props.handleSubmitDefinition(definition);
    setIsSubmitted(true);
  };

  return (
    <div className="writing game-page">
      <Host>
        <h2>Your team is typing out their best definitions:</h2>
        <p>
          When the timer is up, your team will no longer be able to add to their
          defintiion.
        </p>
        <Timer
          seconds={lobbyData.roundSettings.seconds}
          timeUp={setTimerDone}
        />
        <PlayerList />
        <div className="times-up-container">
          <button className="times-up-button" onClick={handleGoToNextPhase}>
            Start Guessing Phase
          </button>
          {timerDone && (
            <p className="times-up">
              Time&apos;s up for players to submit! Start the next phase.
            </p>
          )}
        </div>
        <Modal
          message={
            'There is still time on the clock. Are you sure want to skip to the next phase?'
          }
          handleConfirm={() => props.handleSetPhase('GUESSING')}
          handleCancel={() => setShowModal(false)}
          visible={showModal}
        />
      </Host>
      <Player>
        <h2>First thought = Best thought!</h2>
        <p>
          Your host has chosen a word. Your job is to come up with a definition.
        </p>
        <div className="guess-word">
          <h3 className="guess-h3">Your Word:</h3>
          <p className="word">{lobbyData.word}</p>
        </div>
        {!isSubmitted && !timerDone && (
          <form
            className="submit-definition"
            onSubmit={(e) => {
              handleSubmit(e, definition);
            }}
          >
            <Timer
              seconds={lobbyData.roundSettings.seconds}
              timeUp={setTimerDone}
            />
            <h2>Type out your best guess!</h2>
            <p>
              When the timer is up, you will no longer be able to add to your
              defintion.
            </p>
            <input
              id="definition"
              name="definition"
              type="textfield"
              value={definition}
              onChange={handleChangeDefinition}
            />
            <br />
            <button disabled={!definitionIsValid(definition)}>Submit</button>
          </form>
        )}
        {!isSubmitted && timerDone && <h3>Time&apos;s up!</h3>}
        {isSubmitted && (
          <div>
            <p>Submitted:</p>
            <p>{definition}</p>
          </div>
        )}
      </Player>
    </div>
  );
};

export default Writing;

interface WritingProps {
  handleSubmitDefinition: (definition: string) => void;
  handleSetPhase: (phase: string) => void;
}
