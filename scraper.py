import json

with open('./assets/json/raw.json') as file:
   # Converting json object to python dictionary
   sheet = json.load(file)

neutral = []
misinfo = []
all_headlines = []
headline_id = 0
for entry in sheet['feed']['entry']:
    if entry["gsx$misinfoornot"]["$t"] == 'Misinfo':
        misinfo.append({
            'headline': entry["gsx$headline"]["$t"],
            'isMisinfo': True,
            'tactic': entry["gsx$misinfotactic"]["$t"]
        })
    else:
        neutral.append({
            'headline': entry["gsx$headline"]["$t"],
            'isMisinfo': False,
            'tactic': entry["gsx$misinfotactic"]["$t"]
        })
    all_headlines.append({
        'ID': headline_id,
        'headline': entry["gsx$headline"]["$t"],
        'isMisinfo': entry["gsx$misinfoornot"]["$t"],
        'tactic': entry["gsx$misinfotactic"]["$t"]
    })
    headline_id += 1

with open('./assets/json/neutralHeadlines.json','w') as file:
   # Converting networkx object to json file
   json.dump(neutral,file,indent=4,ensure_ascii=False)

with open('./assets/json/misinfoHeadlines.json','w') as file:
   # Converting networkx object to json file
   json.dump(misinfo,file,indent=4,ensure_ascii=False)

with open('./assets/json/allHeadlines.json','w') as file:
   # Converting networkx object to json file
   json.dump(all_headlines,file,indent=4,ensure_ascii=False)


# # important info
# """
# headlines -> gsx$headline;
# isMisinfo -> gsx$misinfoornot;
# tactic -> gsx$misinfotactic
# """
