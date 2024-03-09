import React, {useContext, useEffect, useState} from 'react';
import './App.css';
import BingMapsReact from "bingmaps-react";
import { FirebaseContext } from './utils/firebase';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore/lite';
function App() {
  const firebase = useContext(FirebaseContext)
  const db = getFirestore(firebase.app);
  const [content, setContent]= useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pins, setPins] = useState([]);
  const [mapReady, setMapReady]=useState(false);

  const getPosts = async()=>{
    const ref = collection(db, "posts");
    const snapshot = await getDocs(ref);
    console.log({snapshot})
    const pins = snapshot.docs.map(({_document:{data:{value:{mapValue: {fields}}}}})=>({
      center: {
        longitude: fields.longitude.doubleValue,
        latitude: fields.latitude.doubleValue
      },
      options: {
        color: 'purple',
        description: fields.content.stringValue,
      }
    }))
    setPins(pins)
  }

  useEffect(() => {
    getPosts();
    return () => {}
  },[db])

  const onSubmit = async (e)=>{
    e.preventDefault();
    setIsLoading(true)
    if(!navigator.geolocation) alert("make sure your browser supports geolocation")
    navigator.geolocation.getCurrentPosition(async({coords: {latitude, longitude}})=>{
      if(!content || !content.length) alert('please Enter text');
      const post = {
        latitude,
        longitude,
        content,
        date: new Date().toDateString(),
        time: new Date().toTimeString()
      };
      const docRef = await addDoc(collection(db, "posts"), post);
      console.log({docRef})
      await getPosts()
      setIsLoading(false)
      setContent('')
    })
  }
  
  return (
    <div className="App">
      <div className='header-nav'>
        <div className='logo-title'>
          <div className='logo' />
          <div>Pin It!</div>
        </div>
        <form name="content" onSubmit={e=>onSubmit(e)}>
          <input type="text" value={content} onChange={e=>setContent(e.target.value)} placeholder="whats on your mind?" disabled={isLoading} />
        </form>
        {!!isLoading &&
          <div className='loading'/>
        }
      </div>
      {process.env.REACT_APP_BING_MAPS_KEY &&
        <BingMapsReact 
          bingMapsKey={process.env.REACT_APP_BING_MAPS_KEY}
          height="100vh"
          width="100%"
            mapOptions={{
              navigationBarMode: "square",
          }}
          onMapReady={()=>setMapReady(true)}
          pushPinsWithInfoboxes={mapReady && pins}
          />
      }
    </div>
  );
}

export default App;
