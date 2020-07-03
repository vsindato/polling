import json

with open('./assets/json/allHeadlines.json','r') as allHeadlines:
    headlines = json.load(allHeadlines)

headlines_to_ids = {headline['headline']:headline['ID'] for headline in headlines}

with open('./assets/json/headlines_to_ids.json','w') as file:
   # Converting networkx object to json file
   json.dump(headlines_to_ids,file,indent=4,ensure_ascii=False)
