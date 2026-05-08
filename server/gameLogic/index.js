const calculateResult = (num1, num2) => {
  const diff = Math.abs(num1 - num2);
  let message = '';
  let type = '';

  if (diff === 0) {
    message = 'Perfect Match! You both won!';
    type = 'match';
  } else if (diff <= 2) {
    message = 'So close!';
    type = 'close';
  } else if (diff <= 5) {
    message = 'Almost got it!';
    type = 'near';
  } else {
    message = 'Try again!';
    type = 'miss';
  }

  return { diff, message, type };
};

module.exports = { calculateResult };
