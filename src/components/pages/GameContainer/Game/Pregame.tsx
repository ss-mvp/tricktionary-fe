import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { getWords } from '../../../../api/apiRequests';
import { lobbySettingsState } from '../../../../state';
import { WordItem } from '../../../../types/gameTypes';
import { Host } from '../../../common/Host';
import { Player } from '../../../common/Player';

const initialChoiceValue = -1;
const initialCustomInputValue = { word: '', definition: '' };

const Pregame = (props: PregameProps): React.ReactElement => {
  const [isCustom, setIsCustom] = useState(false);
  const [choice, setChoice] = useState(initialChoiceValue);
  const [customInput, setCustomInput] = useState(initialCustomInputValue);
  const [wordSelection, setWordSelection] = useState<WordItem[]>([]);
  const lobbySettings = useRecoilValue(lobbySettingsState);
  const [useTimer, setUseTimer] = useState<boolean>(
    lobbySettings.seconds && lobbySettings.seconds > 0 ? true : false,
  );

  // Get 3 word suggestions automatically
  useEffect(() => {
    handleGetWords();
  }, []);

  // Clear choice/input when switching between word selection type
  useEffect(() => {
    if (isCustom) {
      setChoice(-1);
    } else {
      setCustomInput({ word: '', definition: '' });
    }
  }, [isCustom]);

  // Update word selection in lobbySettings object
  useEffect(() => {
    if (isCustom) {
      props.handleSetWord(0, customInput.word, customInput.definition);
    } else {
      props.handleSetWord(choice, undefined, undefined);
    }
  }, [isCustom, choice, customInput]);

  const handleGetWords = () => {
    getWords()
      .then((res) => setWordSelection(res.data.words))
      .catch((err) => console.log(err));
  };

  const handleChoose = (id: number) => {
    setChoice(id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput({
      ...customInput,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.handleSetSeconds(Number(e.target.value));
  };

  const handleSetUseTimer = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      props.handleSetSeconds(60);
    } else {
      props.handleSetSeconds(0);
    }
    setUseTimer(e.target.checked);
  };

  return (
    <div className="pregame game-page">
      <h2>Pregame</h2>
      <Host>
        <button
          className={`${!isCustom ? 'selected' : ''}`}
          onClick={() => setIsCustom(false)}
        >
          Choose a Word
        </button>
        <button
          className={`${isCustom ? 'selected' : ''}`}
          onClick={() => setIsCustom(true)}
        >
          Use My Own
        </button>
        {!isCustom && (
          <div className="word-list">
            {wordSelection.map((word) => (
              <WordChoice
                key={word.id}
                word={word}
                handleChoose={handleChoose}
                choice={choice}
              />
            ))}
            <button onClick={handleGetWords}>Get New Words</button>
          </div>
        )}
        {isCustom && (
          <div className="custom-word">
            <label htmlFor="word">Word:</label>
            <input
              id="word"
              name="word"
              value={customInput.word}
              onChange={handleInputChange}
            />
            <br />
            <label htmlFor="definition">Definition:</label>
            <input
              id="definition"
              name="definition"
              value={customInput.definition}
              onChange={handleInputChange}
            />
          </div>
        )}
        <input
          type="checkbox"
          id="use-timer"
          checked={useTimer}
          onChange={handleSetUseTimer}
        />
        <label htmlFor="use-timer">Use Timer</label>
        <br />
        {useTimer && (
          <>
            <input
              type="number"
              min={0}
              max={120}
              value={lobbySettings.seconds}
              onChange={handleSecondsChange}
              id="seconds"
              name="seconds"
            />
            <label htmlFor="seconds">Seconds to Submit Definition</label>
            <br />
          </>
        )}
        <button onClick={props.handleStartGame}>Start</button>
      </Host>
      <Player>
        <p>Waiting on host to start...</p>
      </Player>
    </div>
  );
};

const WordChoice = (props: WordChoiceProps): React.ReactElement => {
  const { word, handleChoose, choice } = props;
  const className = `word-choice${word.id === choice ? ' selected' : ''}`;
  return (
    <button onClick={() => handleChoose(word.id)} className={className}>
      <p className="word">{word.word}</p>
      <p className="definition">{word.definition}</p>
    </button>
  );
};

export default Pregame;

interface PregameProps {
  handleStartGame: (e: React.MouseEvent) => void;
  handleSetWord: (
    id: number,
    word: string | undefined,
    definition: string | undefined,
  ) => void;
  handleSetSeconds: (seconds: number) => void;
}

interface WordChoiceProps {
  word: {
    id: number;
    word: string;
    definition: string;
  };
  handleChoose: (id: number) => void;
  choice: number;
}
