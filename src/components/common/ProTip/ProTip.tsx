import React, { useState } from 'react';
import proTipImg from '../../../assets/proTip.svg';
import { getRandomFromArray } from '../../../utils/helpers/commonHelpers';
import proTips from '../../../utils/text/proTips.json';

const ProTip = (props: ProTipProps): React.ReactElement => {
  // Display custom message if defined or random message
  const [tipMessage] = useState(
    () => props.message || getRandomFromArray(proTips),
  );

  return (
    <div className="pro-tip">
      <img src={proTipImg} alt="Pro Tip:" role="heading" aria-level={3} />
      <p>{tipMessage}</p>
    </div>
  );
};

export default ProTip;

interface ProTipProps {
  message?: string;
}
