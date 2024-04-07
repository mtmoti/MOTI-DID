const fs = require("fs");

// Function to convert the list of words to JSON and save
function convertWordsToJsonAndSave(inputFilePath, outputFilePath) {
  fs.readFile(inputFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    // Splitting the text data into an array of words
    // Assuming each word is separated by a newline or space
    const wordsArray = data.split(/\r?\n|\s+/);

    // Convert the array to a JSON string
    const json = JSON.stringify(wordsArray, null, 2);

    // Write the JSON string to a file
    fs.writeFile(outputFilePath, json, "utf8", (err) => {
      if (err) {
        console.error("Error writing the JSON file:", err);
      } else {
        console.log("JSON file saved successfully.");
      }
    });
  });
}

// Example usage
const inputFilePath = "/home/px/Downloads/b.txt"; // Path to your input text file
const outputFilePath = "/home/px/Downloads/b.json"; // Path where you want to save the JSON file

convertWordsToJsonAndSave(inputFilePath, outputFilePath);
