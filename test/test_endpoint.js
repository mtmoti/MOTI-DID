const { default: axios } = require('axios');
try {
  axios
    .get('http://localhost:10000/linktree/list')
    .then(e => {
      if (e.status != 200) {
        console.log(e);
      }
      console.log(e.data);
    })
    .catch(e => {
      console.error(e);
    });
} catch (e) {
  console.error(e);
}
