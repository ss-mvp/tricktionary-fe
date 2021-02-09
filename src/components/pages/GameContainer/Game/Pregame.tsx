import React, { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { getWords } from '../../../../api/apiRequests';
import { useLocalStorage } from '../../../../hooks';
import { lobbySettingsState, lobbyState } from '../../../../state';
//styles
import '../../../../styles/components/pages/Pregame.scss';
import { WordItem } from '../../../../types/gameTypes';
import { usernameIsValid } from '../../../../utils/validation';
import { Host } from '../../../common/Host';
import { Player } from '../../../common/Player';
import { PlayerList } from '../Game';

const initialChoiceValue = -1;
const initialCustomInputValue = { word: '', definition: '' };

const Pregame = (props: PregameProps): React.ReactElement => {
  const [isCustom, setIsCustom] = useState(false);
  const [choice, setChoice] = useState(initialChoiceValue);
  const [customInput, setCustomInput] = useState(initialCustomInputValue);
  const [showEditName, setShowEditName] = useState(false);
  const [wordSelection, setWordSelection] = useState<WordItem[]>([]);
  const lobbySettings = useRecoilValue(lobbySettingsState);
  const lobbyData = useRecoilValue(lobbyState);
  const [, setGuesses] = useLocalStorage('guesses', []);
  const [useTimer, setUseTimer] = useState<boolean>(
    lobbySettings.seconds && lobbySettings.seconds > 0 ? true : false,
  );

  const getCurrentWord = () =>
    wordSelection.filter((word) => word.id === choice)[0];

  // Get 3 word suggestions automatically, reset guesses array from previous game
  useEffect(() => {
    handleGetWords();
    setGuesses([]);
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

  const handleChangeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.handleSetUsername(e.target.value);
  };

  const handleSubmitUsername = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEditName(false);
    props.handleUpdateUsername(props.username);
  };

  return (
    <div className="pregame game-page">
      <Host>
        <p className="room-code">Room Code: {lobbyData.lobbyCode}</p>
        {/* Word selection */}
        {!isCustom && (
          <>
            <h2>Please choose a word!</h2>
            <p className="welcome-word">
              While you wait for your team, please pick a word. When all members
              have arrived, press start.
            </p>
            <div className="pick-word-instructions">
              <p className="pick-instructions">
                Click on a word to choose to read its definition. If you like
                that word, ready your team, then click start!
              </p>
              <button className="shuffle-btn sm-btn" onClick={handleGetWords}>
                Shuffle Words
              </button>
            </div>
            <div className="word-list">
              {wordSelection.map((word) => (
                <WordChoice
                  key={word.id}
                  word={word}
                  handleChoose={handleChoose}
                  choice={choice}
                />
              ))}
            </div>
            <p className="or">- OR -</p>
            <button
              className="choose-word sm-btn"
              onClick={() => setIsCustom(!isCustom)}
            >
              {isCustom ? 'Pick One of Our Words' : 'Bring Your Own Word'}
            </button>
          </>
        )}
        {/* Selected word information */}
        {!isCustom && getCurrentWord() && (
          <div className="word-block">
            <div className="word-definition">
              <p className="sm-word">Word:</p>
              <p className="word">{getCurrentWord()?.word}</p>
              <p className="sm-word">Definition:</p>
              <p className="definition">{getCurrentWord()?.definition}</p>
            </div>
            <button
              className="start-btn center"
              onClick={props.handleStartGame}
            >
              Start Game!
            </button>
          </div>
        )}
        {/* Custom word form */}
        {isCustom && (
          <>
            <h2>Bring Your Own Word!</h2>
            <p>
              While you wait for your team, please enter your word and its
              definition word. When all members have arrived, press start.
            </p>
            <div className="word-block">
              <div className="word-column col-a">
                <label htmlFor="word">Word:</label>
                <input
                  id="word"
                  name="word"
                  value={customInput.word}
                  onChange={handleInputChange}
                />
                <label htmlFor="definition">Definition:</label>
                <input
                  id="definition"
                  name="definition"
                  value={customInput.definition}
                  onChange={handleInputChange}
                />
              </div>
              <div className="word-column col-b">
                <button
                  className="choose-word sm-btn"
                  onClick={() => setIsCustom(!isCustom)}
                >
                  {isCustom ? 'Pick One of Our Words' : 'Bring Your Own Word'}
                </button>
                <button className="start-btn" onClick={props.handleStartGame}>
                  Start Game!
                </button>
              </div>
            </div>
          </>
        )}
        <div className="timer-container">
          <h3 className="timer-title">Set A Timer!</h3>
          <p className="timer-directions">
            This timer is to deterimite how long player’s have to type.
          </p>
          {useTimer && (
            <>
              <input
                className="timer-itself"
                type="number"
                min={0}
                max={120}
                value={lobbySettings.seconds}
                onChange={handleSecondsChange}
                id="seconds"
                name="seconds"
              />
            </>
          )}
          <div className="timer-wrap">
            <input
              type="checkbox"
              id="use-timer"
              checked={useTimer}
              onChange={handleSetUseTimer}
            />
            <p>Play without a timer</p>
          </div>
        </div>
        <PlayerList />
      </Host>
      <Player>
        <h2>Wait!</h2>
        <p>
          While you wait for your team, please pick a word. When all members
          have arrived, press start.
        </p>
        <p>Waiting on host to start...</p>
        <PlayerList />
        {!showEditName && (
          <button onClick={() => setShowEditName(true)}>Edit Name</button>
        )}
        {showEditName && (
          <form>
            <label htmlFor="edit-name">Edit Name</label>
            <input
              id="edit-name"
              name="edit-name"
              value={props.username}
              onChange={handleChangeUsername}
            ></input>
            <button
              disabled={!usernameIsValid(props.username)}
              onClick={handleSubmitUsername}
            >
              Confirm
            </button>
          </form>
        )}
      </Player>
    </div>
  );
};

const WordChoice = (props: WordChoiceProps): React.ReactElement => {
  const { word, handleChoose, choice } = props;
  const className = `word-choice${word.id === choice ? ' selected' : ''}`;
  return (
    <>
      <button onClick={() => handleChoose(word.id)} className={className}>
        <p className="word">{word.word}</p>
      </button>
    </>
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
  handleSetUsername: (newUsername: string) => void;
  username: string;
  handleUpdateUsername: (newUsername: string) => void;
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
