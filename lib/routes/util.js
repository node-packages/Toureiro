module.exports = {
  safeParse: data => {
    try {
      return JSON.parse(data);
    } catch (err) {
      return data;
    }
  }
};
