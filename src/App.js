import './App.css';
import { useState, useEffect} from 'react';
import io from 'socket.io-client'

const socket = io.connect("http://localhost:3001") //the thing where we connect to back end, replace with backend api
const VALUES = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
const REVVALUES = ['2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3']

function card_order(i, rev){
  var value
  if (i === "JB" || i === "JR"){
    value = 20
    return value
  }
  if (rev === true){
    value = REVVALUES.indexOf(i.slice(1))
  }
  else{
    value = VALUES.indexOf(i.slice(1))
  }
  return value
}

function sort_deck(deck){
  var temp;
  var swapped;
  for (let i = 0; i < deck.length; i++) //for every card in deck
  {
    swapped = false;
    for (let j = 0; j < deck.length - i - 1; j++) 
    {
      if (card_order(deck[j], false) > card_order(deck[j + 1], false)) 
      {
          // Swap arr[j] and arr[j+1]
          temp = deck[j];
          deck[j] = deck[j + 1];
          deck[j + 1] = temp;
          swapped = true;
      }
    }
    if (swapped === false){
      break
    }
  }
  return deck
}

/////

function Card({current, card, deck, onCardClick}){
  var color = '';
  if (current[card]){
    color = 'selected'
  }
  if (deck[card]){ //card not empty
    const imagename = deck[card].slice(0, 1) + '-' + deck[card].slice(1) + ".png"
    return <img src={require('./images/' + imagename)} className={'player card' + color} onClick={onCardClick} alt= {deck[card]}/>
  }
  else{
    return
  }
}

function JoinPanel({setRoom, joinRoom}){
  return(
    <>
      <div id='greypanel'>
        <input id = 'joininput'
          placeholder='Room Number...' 
          onChange={(event) =>{
          setRoom(event.target.value)
        }}></input>
        <br></br>
        <button onClick={joinRoom}> Join Room</button>
      </div>
    </>
  )
}

function PlayedCard({card, deck}){
  const imagename = deck[card].slice(0, 1) + '-' + deck[card].slice(1) + ".png"
  return <img src={require('./images/' + imagename)} className={'static card'} alt = {deck[card]}/>
}

function OpponentArea({decknum}){
  let componentArr = [] //render cards
  const deck = Array(13).fill('BC')
  for (let i = 0; i < decknum; i++) {
    componentArr.push(
      <PlayedCard key={i} 
      deck = {deck} 
      card = {i}/>);
  }
  return (
    <>
      <div className = {'opponent hand'}>
        {componentArr}
      </div>
    </>
  )
}

function PlayArea({playcards}){
  let playareadiv = []
  for (let i = 0; i < playcards.length; i++) {
    playareadiv.push(<PlayedCard key={i} deck = {playcards} card = {i}/>);
  }

  return (
    <>
      <div id= 'playarea'>
        {playareadiv}
      </div>
    </>
  )
}

//////////////

function CardArea({Hand, setHand, Turn, PlayAreaCards, Onplayclick, OnRevolution, Rev, Handnum, setHandnum, Disable, Restart, Quit}){
  //const [Hand, setHand] = useState(Deck);
  //const [Handnum, setHandnum] = useState(13)
  const [currentcards, setcurrentcards] = useState(Array(13).fill(null))
  const [currentcardnum, setcurrentcardnum] = useState(0)

  function playcards(){ //when playing selected cards
    if (!Turn || Disable){
      return
    }
    if (currentcardnum === 0){ //if no slected cards
      return;//go back
    }

    var clearboard = false
    
    if (PlayAreaCards.length !== 0){ //if play area is not empty
      if (PlayAreaCards.length !== currentcardnum){ //if not the same amount of current cards played against the played number of cards
        return
      }
      else{//same number of cards
        var i = 0
        while (!currentcards[i]){
          i++
        } //out of loop, got a not null card
        if (PlayAreaCards.length === 1 && (PlayAreaCards[0] === 'JB' || PlayAreaCards[0] === 'JR')){ //only one card played and its a joker
          if (currentcardnum === 1 && currentcards[i] !== 'S3'){ //if the selected card is NOT a 3 of spades AND only one card, return
            return
          }
          else{ //it is a 3 of spades, auto clear board, also your turn
            clearboard = true
          }
        }
        else if (PlayAreaCards.length === 1 && (currentcardnum === 1 && currentcards[i].slice(1) === '8')){ //if its an 8 stop one card
          clearboard = true
        }
        else{
          if (Rev === false){
            if (card_order(PlayAreaCards[0], false) >= card_order(currentcards[i], false)){ //if the played cards has a higher value or equal
              return
            }
          }
          else{ //revolution, so reverse values
            if (card_order(PlayAreaCards[0], true) >= card_order(currentcards[i], true)){ //if the played cards has a higher value or equal
              return
            }
          }
        }
      }
    }

    const nexthand = Hand.slice()
    for (let j = 0; j < currentcards.length; j++){
      if (currentcards[j]){ //selected card
        if (currentcards[j].slice(1) === '8'){
          clearboard = true
        }
        nexthand[j] = null //set hand to null the selected cards, all other cards have the same state
      }
    }

    setHand(nexthand) //setnext hand to delyeet current cards
    setHandnum(Handnum-currentcardnum)
    if (clearboard === true){ //8 stop or 3 of spades
      Onplayclick([], Handnum-currentcardnum, true, Rev)
    }
    else{
      if (currentcardnum === 4){ //revolutionnnnn
        OnRevolution(!Rev)
        Onplayclick(currentcards, Handnum-currentcardnum, false, !Rev)
      }
      else{
        Onplayclick(currentcards, Handnum-currentcardnum, false, Rev) //play these current cards to the play area
      }
    }
    setcurrentcards(Array(13).fill(null)) //reset current cards
    setcurrentcardnum(0)
  }

  function selectcard(i){ //when selecting cards
    if (!Turn){
      return
    }
    const nextcards = currentcards.slice()
    if (nextcards[i]){ //if that card was already selected (red), deselect
      nextcards[i] = null
      setcurrentcards(nextcards)
      setcurrentcardnum(currentcardnum - 1)
      return
    }
    if (currentcardnum === 4){ //can only hold a max of 4 cards
      return //do nothing
    }
    //not red cards
    if (Hand[i] === 'JB' || Hand[i] === 'JR'){ //jokers were selected
      nextcards[i] = (Hand[i]) //add 
      setcurrentcards(nextcards)
      setcurrentcardnum(currentcardnum + 1)
      return
    }
    for (var j of nextcards) //none of the above, check all cards already selected previously
    {
      if (j && !(j === 'JB' || j === 'JR')){//not empty card and is not a joker
        if (j.charAt(1) === Hand[i].charAt(1)){ //if number matches the selecteded card
          nextcards[i] = (Hand[i]) //put in
          setcurrentcards(nextcards)
          setcurrentcardnum(currentcardnum + 1)
          return
        } //doesnt match. don't put in, end
        else{
          return
        }
      }
    } //all cards are empty or are jokers
    nextcards[i] = (Hand[i]) 
    setcurrentcards(nextcards)
    setcurrentcardnum(currentcardnum + 1)
    return
  }

  function pass(){
    if (!Turn || Disable){
      return
    }
    Onplayclick([], Handnum, false, Rev)
  }

  let componentArr = [] //render cards
  for (let i = 0; i < 13; i++) {
    componentArr.push(
      <Card key={i} 
      onCardClick={() => selectcard(i)} 
      current = {currentcards} 
      deck = {Hand} 
      card = {i}/>);
  }

  return(
    <>
      <div className = {'player hand'}>
        {componentArr}
      </div>
      <div id='greypanel2'>
        {Disable ? 
          <>
            <button onClick={Restart}>Next Round</button>
            <button style={{'marginLeft': '16px'}} onClick={Quit}>Quit Game</button> 
          </>
          :
          <>
            <button onClick={() => playcards()}>Play Card</button>
            <button style={{'marginLeft': '70px'}} onClick={() => pass()}>Pass</button> 
          </>
        }
      </div>
  </>
  )
}

function Board(){
  const [room, setRoom] = useState("") //room number
  const [playareacards,setplayarea] = useState([]) //the play area cards
  const [revolution, setrevolution] = useState(false)
  const [winner, setWinner] = useState(false)
  const [inroom, setRoombool] = useState(false) //if in a room, the whole card game room
  const [yourturn, setyourturn] = useState(false)
  const [opponentnum, setopponentnum] = useState(13)
  const [Handnum, setHandnum] = useState(13)
  const [hand, setHand] = useState([])
  const [inwaitroom, setwaitroom] = useState(false)
  let status

  useEffect(() => { //calls when the component renders/added, or socket is updated, i think?
    socket.on('isPlayerA', (deck) => { //player who joined first goes first
      setRoombool(true)
      setHand(sort_deck(deck))
      setyourturn(true)
      setwaitroom(true)
    })

    socket.on('isPlayerB', (deck) => { //player who get 2nd
      setRoombool(true)
      setHand(sort_deck(deck))
    })

    socket.on('playerBjoined', () => { //other player joined
      setwaitroom(false)
    })

    socket.on('update_game', (newopponentnum, playedcards, skip, rev) => { //your opponent played their cards
      if (!skip){
        setyourturn(!yourturn)
      }
      setrevolution(rev)
      setplayarea(playedcards)
      setopponentnum(newopponentnum)
      if (newopponentnum === 0){
        setWinner(true)
      }
    })

    socket.on('new_round', (deck, isyourturn) => { //other player joined
      newgame()
      setHand(sort_deck(deck))
      setyourturn(isyourturn)
    })


    socket.on('reset_game_state', () => { //reset game state (on disconnect from other player)
      newgame()
    })
  })

  useEffect(() => { //alerts in case the below happens
    socket.on('disconnected', (reason) => {
      setRoombool(false)
      setwaitroom(false)
      if (reason === false){ //other person disconnected by closing tab
        alert("The opponent disconnected!")
      }
      else{ //other person quit the game
        alert("The opponent quit the game")
      }
      return () => { socket.off('disconnected')} //fixes the render firing twice?
    })

    socket.on('deny', () => {
      alert('Room not avaliable')
      return () => { socket.off('deny')} //fixes the render firing twice
    })
  }, []) //<- add this empty list so it fires only once

  function onplaycards(playedcards, handnumber, skip, rev){ //you played your cards
    if (winner === true){
      return //win, so no point in playing
    }
    const temp = []
    for (let i of playedcards){
      if (i){
        temp.push(i)
      }
    }
    setplayarea(temp)
    if (!skip){
      setyourturn(!yourturn) //switch turns (unless that did an 8 stop or 3 of spades)
    }
    socket.emit("play_cards", room, handnumber, temp, skip, rev)
    if (handnumber === 0){
      setWinner(true)
    }
  }

  function newgame(){ //for reset game state on user end (no deck yet)
    setyourturn(false)
    setrevolution(false)
    setplayarea([])
    setopponentnum(13)
    setWinner(false)
    setHandnum(13)
  }

  function quitgame(){
    socket.emit("quitgame", room)
    setRoom("") //no room number now
    setRoombool(false) //back to main
    newgame() //reset values
  }

  function nextround(){ //go to next round and also inform everyone else, also get new deck
    socket.emit("next_round", room) //send room number
  }

  const joinRoom = () => {
    if (room !== ""){
      socket.emit("join_room", room);
    }
  }

  if (winner === true){
    if (yourturn){
      status = "The opponent won!"
    }
    else{
      status = "You won!"
    }
  }
  else if (revolution === true){
    status = "Revolution!"
  }
  else{
    status = "Game Start!"
  }

  if (inroom === false){
    return(
      <>
        <JoinPanel setRoom = {setRoom} joinRoom = {joinRoom}/>
      </>
    )
  }
  else if (inwaitroom === true){
    return(
      <>
        <div id='greypanel'>
          <h1 style={{'color': 'white'}}>Waiting for Player 2...</h1>
        </div>
      </>
    )
  }
  else{
    return (
      <>
        <h1 className= {yourturn ? "playerturn" : "opponentturn"} >{winner ? null : (yourturn ? "Your Turn": "Opponent Turn")}</h1>
        <h1>Opponent: {opponentnum} Cards</h1>
          <OpponentArea decknum = {opponentnum}/>
        <h1>{status}</h1>
        <PlayArea playcards = {playareacards}/>
        <h1>Player: {Handnum} Cards</h1>
          <CardArea 
            Quit = {quitgame}
            Restart = {nextround}
            Handnum = {Handnum}
            setHandnum = {setHandnum}
            Hand = {hand}
            setHand = {setHand}
            Turn = {yourturn}
            Disable = {winner}
            Onplayclick = {onplaycards} 
            PlayAreaCards={playareacards} 
            Rev = {revolution} 
            OnRevolution = {setrevolution}/>
        </>
    );
  }
}

export default Board

/////////////////////
