
import mapList from '../lib/mapList.json';
import emoteList from '../lib/emoteList.json';

export default class MapSelector {
    #defaultMapList;
    #onlineMapList;
    #mapList;

  constructor() {
    this.#defaultMapList = mapList;
    this.#onlineMapList = [];
    this.getOnlineMapList();
    if(this.#onlineMapList.length > 0){
        this.#mapList = this.#onlineMapList;
    }
    else{
        this.#mapList = this.#defaultMapList;
    }
  }

    getOnlineMapList(){
        // fetch maps from vinz3210.gg/automaplist.json
        try{
            this.#onlineMapList = fetch('https://vinz3210.gg/automaplist.json', { mode: 'no-cors' })
            .then(response => response.json())
            .then(data => {
                return data;
            });
        }
        catch(err){
            console.error(err);
        }        
    }

    checkIfMapExists(URL: string): boolean{
        try{
            let queryURL = "https://www.geoguessr.com/maps/"+ URL;
            // check if queryURL returns a 200 status code
            fetch(queryURL)
            .then(response => {
                if(response.ok){
                    return true;
                }
                else{
                    return false;
                }
            })
        }
        catch(err){
            console.error(err);
        }
        return false;
        
    }

    getMapSample(){
        // each of the maps has a weight attribute, which is used to determine the probability of the map being selected
        // select 5 maps at random, with the probability of each map being selected being proportional to its weight
        // return the list of selected maps
        let mapSample: any[] = [];
        let totalWeight = 0;
        let mapWeights: number[] = [];
        let mapList = this.#mapList;

        // calculate the total weight
        for(let map of mapList){
            totalWeight += map.weight;
            mapWeights.push(map.weight);
        }

        // select 5 maps
        for(let i = 0; i < 5; i++){
            let rand = Math.random() * totalWeight;
            let sum = 0;
            for(let j = 0; j < mapList.length; j++){
                sum += mapWeights[j];
                if(rand < sum){
                    mapSample.push(mapList[j]);
                    break;
                }
            }
        }

        // for each map in the sample list, remove it from the mapList
        for(let map of mapSample){
            let index = mapList.indexOf(map);
            mapList.splice(index, 1);
        }

        // for each of the maps in the sample list check if the map exists
        // if the map does not exist, remove it from the sample list
        for(let map of mapSample){
            let exists = this.checkIfMapExists(map.url);
            if(!exists){
                let index = mapSample.indexOf(map);
                mapSample.splice(index, 1);
                // log as error
                console.error("Map does not exist: " + map.url);
            }
        }

        // for each of the maps in the sample list, add a random unique emote to the map
        let emotes = emoteList;
        for(let map of mapSample){
            let emoteIndex = Math.floor(Math.random() * emotes.length);
            map.emote = emotes[emoteIndex];
            emotes.splice(emoteIndex, 1);
        }
        return mapSample;
    }


  
}