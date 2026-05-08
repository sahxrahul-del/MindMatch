const generateRoomId = (length = 5) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar looking chars like I, 1, O, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = { generateRoomId };
