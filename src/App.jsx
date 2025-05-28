import {useReducer, useEffect} from "react";

const initialState = {
    candidates: [],
    newCandidate: '',
    status: 'loading'
}

function reducer(state, action) {
    switch (action.type) {
        case 'reset_votes':
            return {
                ...state,
                candidates: state.candidates.map((candidate) => ({...candidate, votes: 0}))
            }
        case 'update_new_candidate':
            return {...state, newCandidate: action.payload}
        case 'add_candidate':
            if (
                !action.payload.trim() ||
                state.candidates.some((candidate) => candidate.name === action.payload)
            ) {
                return state
            }
            return {
                ...state,
                candidates: [...state.candidates, {name: action.payload, votes: 0}],
                newCandidate: '',
            }
        case 'dataReceived':
            return {
                ...state,
                candidates: action.payload,
                status: 'ready',
            }
        case 'dataFaild':
            return {
                ...state, status: 'error'
            }
        case 'vote_up':
            return incrementVote(state, action.payload)
        case 'vote_down':
            return decrement(state, action.payload)
    }
}

function incrementVote(state, name) {
    return {
        ...state,
        candidates: state.candidates.map((candidate) =>
            candidate.name === name ? {...candidate, votes: candidate.votes + 1} : candidate)
    }
}

function decrement(state, name) {
    return {
        ...state, candidates: state.candidates.map((candidate) =>
            candidate.name === name ? {
                ...candidate, votes: Math.max(candidate.votes - 1, 0)
            } : candidate)
    }
}

function VoteTracker() {
    const [state, dispath] = useReducer(reducer, initialState)

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('http://localhost:9000/candidates')
                if (!res.ok) {
                    throw new Error('Failed to fetch data')
                }
                const data = await res.json()
                dispath({type: 'dataReceived', payload: data})
            } catch (error) {
                dispath({type: 'dataFaild'})
            }
        }

        fetchData()
    }, [])

    if (state.status === 'loading') {
        return <p>Loading data? please wait...</p>
    }

    if (!state.status === 'error') {
        return <p>LFailed data..</p>
    }

    return (
        <>
            <h1>Vote Tracker</h1>
            <ul>
                {state.candidates.map((candidate) => (
                    <li key={candidate.id}>{candidate.name}: {candidate.votes} votes
                        <button onClick={() => dispath({type: 'vote_up', payload: candidate.name})}>+</button>
                        <button onClick={() => dispath({type: 'vote_down', payload: candidate.name})}>-</button>
                    </li>
                ))}
            </ul>
            <button onClick={() => dispath({type: 'reset_votes'})}>Reset Votes</button>
            <div>
                <h2>Add Candidate</h2>
                <input
                    type="text"
                    placeholder="Candidate name"
                    value={state.newCandidate}
                    onChange={(e) => dispath({type: 'update_new_candidate', payload: e.target.value})}
                />
                <button onClick={() => dispath({type: 'add_candidate', payload: state.newCandidate})}>Add</button>
            </div>
        </>
    );
}

export default VoteTracker;
