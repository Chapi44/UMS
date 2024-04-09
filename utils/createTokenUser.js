const createTokenUser = (user) => {
  return {
    fullname: user.fullname,
    userId: user._id,
    role: user.role,
    pictures: user.pictures,
    username:user.username

  };
};


const createTokenUser1 = (instructor) => {
  return {
    firstName: instructor.firstName,
    lastName: instructor.lastName,
    userId: instructor._id,
    role: instructor.role,
    status:instructor.status

  };
};
module.exports = {createTokenUser, createTokenUser1};
