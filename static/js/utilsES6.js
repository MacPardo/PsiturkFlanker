
/**
 * @param {Object[]} objArray
 * @returns {String}
 */
function objArray2Table(objArray) {

  /** @todo REMOVE THIS FUNCTION IN PRODUCTION */

  if (objArray.length === 0) {
    console.error("ARRAY CANNOT BE EMPTY");
    return;
  }

  var props = [];

  for (var prop in objArray[0]) {
    console.log("prop is", prop);
    props.push(prop);
  }

  return `
  <table class="table">
    <thead>
      ${props.map(prop => `
        <th>${prop}</th>
      `).join("")}
    </thead>
    <tbody>
    ${objArray.map(obj => `
      <tr>
      ${props.map(prop => `
        <td>
        ${obj[prop]}
        </td>
      `).join("")}
      </tr>
    `).join("")}
    </tbody>
  </table>
  <hr>
  <br>
  `
}