import http from 'http'
import console from 'console'
import config from 'config'
import Symptoms from './symptoms.json'

export default function (parameterInfo) {
  console.log(parameterInfo.drugName);
  console.log(parameterInfo.drugName === undefined);
  if (parameterInfo.typeOfDetail == 'diagnosis') {
    for (let i = 0; i < Symptoms.length; i++) {
      var obj = Symptoms[i];
      if (obj.Name.toLowerCase().trim() == String(parameterInfo.symptom).toLowerCase().trim()) {
        var id = obj.ID;
        break;
      }
    }
    const medicURL = `https://healthservice.priaid.ch/diagnosis?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InJhaW5hODc0NkBnbWFpbC5jb20iLCJyb2xlIjoiVXNlciIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL3NpZCI6IjEwMDIwIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy92ZXJzaW9uIjoiMTA5IiwiaHR0cDovL2V4YW1wbGUub3JnL2NsYWltcy9saW1pdCI6IjEwMCIsImh0dHA6Ly9leGFtcGxlLm9yZy9jbGFpbXMvbWVtYmVyc2hpcCI6IkJhc2ljIiwiaHR0cDovL2V4YW1wbGUub3JnL2NsYWltcy9sYW5ndWFnZSI6ImVuLWdiIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9leHBpcmF0aW9uIjoiMjA5OS0xMi0zMSIsImh0dHA6Ly9leGFtcGxlLm9yZy9jbGFpbXMvbWVtYmVyc2hpcHN0YXJ0IjoiMjAyMy0wNy0xNyIsImlzcyI6Imh0dHBzOi8vYXV0aHNlcnZpY2UucHJpYWlkLmNoIiwiYXVkIjoiaHR0cHM6Ly9oZWFsdGhzZXJ2aWNlLnByaWFpZC5jaCIsImV4cCI6MTY5MjU5OTE3OCwibmJmIjoxNjkyNTkxOTc4fQ.lyf8LsDp8osD8u1BX3TNO7P_dWLfolPRKUuk9H0PyWU&language=en-gb&year_of_birth=${parameterInfo.yob}&gender=${parameterInfo.gender}&symptoms=[${id}]`;
    console.log(medicURL);
    let options = {
      format: "json"
    }
    let response = http.getUrl(medicURL, options);
    console.log(response);
    let reqResponse = {
      diagnosis: response[0].Issue.Name,
      accuracy: response[0].Issue.Accuracy
    }
    console.log(reqResponse);
    return reqResponse;
  } else {
    let parameter = (parameterInfo.drugParameter === undefined) ? parameterInfo.drugParameter : parameterInfo.drugParameter.toLowerCase().trim();
    let fdaURL = `https://api.fda.gov/drug/label.json?search=purpose:${parameterInfo.drugName}`
    var status_options = {
      format: "json",
      returnHeaders: true
    }
    let options = {
      format: "json",
    }
    var test_response = http.getUrl(fdaURL, status_options);
    if (test_response.status == 200) {
      let response = http.getUrl(fdaURL, options);
      if (String(response.results[0].do_not_use[0]).length > 500) {
        var body = {
          language: 'english',
          summary_percent: 10,
          text: String(response.results[0].indications_and_usage[0])
        }
        let summarizedResponse = http.postUrl(summaryURL, body, summary_options);
        response.responseText.results[0].do_not_use[0] = summarizedResponse.summary;
      }
      if (String(response.results[0].indications_and_usage[0]).length > 500) {
        body = {
          language: 'english',
          summary_percent: 10,
          text: String(response.results[0].indications_and_usage[0])
        }
        let summarizedResponse = http.postUrl(summaryURL, body, summary_options);
        response.results[0].indications_and_usage[0] = summarizedResponse.summary;
      }
      var summaryURL = "https://text-analysis12.p.rapidapi.com/summarize-text/api/v1.1"
      var summaryKey = config.get('summKey');
      var summary_options = {
        format: "json",
        passAsJson: true,
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': summaryKey,
          'X-RapidAPI-Host': 'text-analysis12.p.rapidapi.com'
        }
      }
      if (parameter == undefined) {
        let reqResponse = {
          activeingredient: response.results[0].active_ingredient[0],
          purpose: response.results[0].indications_and_usage[0],
          warnings: response.results[0].do_not_use[0],
          dosage: response.results[0].dosage_and_administration[0]
        }
      } else {
        if (parameter === "active ingredient") {
          let reqResponse = {
            activeingredient: response.results[0].active_ingredient[0]
          }
          reqResponse.params = true;
          console.log(reqResponse)
          return reqResponse;
        }
        if (parameter == "warnings") {
          var data = {
            language: 'english',
            summary_percent: 40,
            text: response.results[0].do_not_use[0]
          }
          var sum = http.postUrl(summaryURL, data);
          console.log(sum);
          let reqResponse = {
            warnings: response.results[0].do_not_use[0]
          }
          reqResponse.params = true;
          console.log(reqResponse)
          return reqResponse;
        }
        if (parameter == "purpose") {
          let reqResponse = {
            purpose: response.results[0].indications_and_usage[0]
          }
          reqResponse.params = true;
          console.log(reqResponse)
          return reqResponse;
        }
        if (parameter == "dosage" || parameter == "administration") {
          let reqResponse = {
            dosage: response.results[0].dosage_and_administration[0]
          }
          reqResponse.params = true;
          console.log(reqResponse)
          return reqResponse;
        }
      }
    } else if (test_response.status == 404) {
      let response = http.getUrl(fdaURL, status_options);
      if (response.status == 404) {
        console.log("in here");
        var googleKey = config.get('PaLMkey');
        var googleURL = "https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=AIzaSyBBUfgkxoNs9uPylQVe8x8FUqIWbnkXoNU";
        var google_options = {
          format: "json",
          headers: {
            'content-type': 'application/json'
          }
        }
        let info = "";
        if (parameterInfo.drugParameter === undefined)
          info += "get active ingredient, purpose, warnings and dosage of " + parameterInfo.drugName + " text only";
        else
          info += parameterInfo.drugParameter + "of" + parameterInfo.drugName + " text only";
        console.log(info);
        var google_body = `{
        "prompt": {
          "text": 'get active ingredient, purpose, warnings and dosage of metformin'
        },
        "safetySettings": [
          {
            "category": 'HARM_CATEGORY_TOXICITY',
            "threshold": 'BLOCK_NONE'
          },
          {
            "category": 'HARM_CATEGORY_MEDICAL',
            "threshold": 'BLOCK_NONE'
          },
          {
            "category": 'HARM_CATEGORY_VIOLENCE',
            'threshold': 'BLOCK_NONE'
          },
          {
            "category": 'HARM_CATEGORY_DANGEROUS',
            "threshold": 'BLOCK_NONE'
          },
          {
            "category": 'HARM_CATEGORY_SEXUAL',
            'threshold': 'BLOCK_NONE'
          }
        ],
        "temperature": 0,
        "maxOutputTokens": 1000
      }`
        let googleResponse = http.postUrl(googleURL, google_body, google_options);
        if (googleResponse.status == 404)
          console.log(googleResponse);
        let rsp = {
          generated: googleResponse.candidates[0].output
        }
        return rsp;
      }
    }
  }
}