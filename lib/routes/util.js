module.exports = {
  safeParse: function (data) {
    try {
      return JSON.parse(data)
    } catch (err) {
      return data;
    }
  }
};
