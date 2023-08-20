import http from 'http'
import console from 'console'
import config from 'config'
import fail from 'fail'

export default function (drugInfo) {
  let parameter = (drugInfo.drugParameter === undefined) ? drugInfo.drugParameter : drugInfo.drugParameter.toLowerCase().trim();
  let fdaURL = `https://api.fda.gov/drug/label.json?search=purpose:${drugInfo.drugName}`
  var status_options = {
    format: "json",
    returnHeaders: true 
    // returnHeaders: true
  }
  var options = {
    format: "json",
    // returnHeaders: true,
  }
  var test_response = http.getUrl(fdaURL, status_options);
  // console.log(response);
  // console.log(response.responseText.results);
  if (test_response.status == 200){
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
      return reqResponse;
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
  }
  else if (test_response.status == 404){
    let response = http.getUrl(fdaURL, status_options);
    // console.log(test_response);
    if (response.status == 404) {
      console.log("in here");
      var googleKey = config.get('PaLMkey');
      var googleURL = "https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=AIzaSyBBUfgkxoNs9uPylQVe8x8FUqIWbnkXoNU";
      var google_options = {
        format: "json",
        // returnHeaders: true,
        headers: {
          'content-type': 'application/json'
        }
      }
      let info = "";
      if (drugInfo.drugParameter === undefined)
        info += "get active ingredient, purpose, warnings and dosage of " + drugInfo.drugName + " text only";
      else
        info += drugInfo.drugParameter + "of" + drugInfo.drugName + " text only";
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