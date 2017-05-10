const { createStore, combineReducers, applyMiddleware } = require('redux');
const createSagaMiddleware = require('redux-saga').default;
const { all, call, put, takeEvery, select } = require('redux-saga/effects');
const fetch = require('node-fetch');

(() => {

    // ---------------
    //  HELPERS
    // ---------------
    const fetchApi = endPoint =>
        fetch(endPoint)
        .then(result => result.json())
        .then(json => json);

    // ---------------
    //  REDUCERS
    // ---------------
    const user = (state = {}, action) => {
        if (action.type === 'SET_USER') {
            return action.payload;
        }
        return state;
    };

    const profile = (state = {}, action) => {
        if (action.type === 'SET_PROFILE') {
            return action.payload;
        }
        return state;
    };

    const userError = (state = '', action) => {
        if (action.type === 'FETCH_USER_ERROR') {
            return action.error.message;
        }
        return state;
    };

    const rootReducer = combineReducers({ user, profile, userError });

    // ---------------
    //  MIDDLEWARES
    // ---------------
    const log = function *() {
        yield takeEvery('*', function *logger(action) {
            const state = yield select();

            console.log('action: ', action.type);
            console.log('state: ', JSON.stringify(state));
            console.log('== == ==');
        });
    };

    const fetchUser = function *() {
        try {
            const userData = yield call(fetchApi, 'http://localhost:4000/api/user', {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            yield put({
                type: 'SET_USER',
                payload: userData
            });

            const userProfile = yield call(fetchApi, `http://localhost:4000/api/${userData.id}/profile`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            yield put({
                type: 'SET_PROFILE',
                payload: userProfile
            });

        } catch (error) {
            yield put({ type: 'FETCH_USER_ERROR', error });
        }
    };

    const getUser = function *() {
        yield takeEvery('GET_USER', fetchUser);
    };

    const rootSaga = function *() {
        yield all([
            log(),
            getUser()
        ]);
    };

    const sagaMiddleware = createSagaMiddleware();

    // -------------
    // STORE
    // -------------
    const store = createStore(
        rootReducer,
        applyMiddleware(sagaMiddleware)
    );

    // -------------
    // app
    // -------------
    sagaMiddleware.run(rootSaga);
    store.dispatch({ type: 'GET_USER' });

})();
