const bcrypt = require("bcrypt");

// 이 코드는 사용자 회원가입을 처리하는 함수로,
// 주어진 이메일, 비밀번호, 닉네임으로 사용자를 가입시킵니다.
// 여기에는 bcrypt를 사용하여 비밀번호를 해시화하고,
// MySQL에 저장하는 로직으로 사용자 데이터를 배열로 전달합니다.

module.exports = {
  signup: async (nickname, email, password, profile_img) => {
    // 1. `bcrypt.genSalt()`를 호출하여 salt 객체 생성.
    // 보안을 위해 사용
    const salt = await bcrypt.genSalt();
    console.log(salt);
    try {
      // 2. `bcrypt.hash()`를 사용하여 입력된 비밀번호를 salt 객체와 함께 해시
      // 해시화된 비밀번호는 MySQL에 저장하기 위해 변수로 저장
      const hashedPassword = await bcrypt.hash(password, salt);
      // 3. user로 MySQL에 전달할 데이터들을 배열로 전달
      // 여기서 비밀번호는 해시화한 비밀번호를 전달
      const user = [nickname, email, hashedPassword, profile_img];
      return user;
    } catch (err) {
      // 에러 처리
      throw err;
    }
  },
};
