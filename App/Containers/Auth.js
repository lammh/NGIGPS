import React, { Component } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import InputTextField from '../Components/InputTextField';
import Logo from '../Assets/images/Logo.png';
import SocialSignup from '../Components/modals/SocialSignup';
import AsyncStorage from '@react-native-community/async-storage';
import { Config } from '../Config/api'
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';
import { LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager } from 'react-native-fbsdk';
import FacebookSignInButton from '../Components/FBLoginButton';
import axios from "axios";
import {
  userLogin,
  googleOauth,
  getFacebookProfile,
  facebookOauth,
} from '../Services/api/authService';
import * as Animatable from 'react-native-animatable'

const API_URL = Config.API_URL;
const ACCESS_TOKEN = 'access_token';

export default class Auth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      userInfo: null,
      error: "",
      showProgress: false,
      passwordVisible: false,
      googleModalVisible: false,
      facebookModalVisible: false,
    };
  }


  redirect(routeName, accessToken){
    this.props.navigator.push({
      name: routeName
    });
  }

  async onLoginPressed() {
    this.setState({showProgress: true})
    try {
      let response = await fetch(API_URL+'/users/mobile/signin', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session:{
            email: this.state.email,
            password: this.state.password,
          }
        })
      });
      let res = await response.text();
      if (response.status >= 200 && response.status < 300) {
        //Handle success
        let accessToken = res;
        console.log(accessToken);
        //On success we will store the access_token in the AsyncStorage
        this.storeToken(accessToken);
        this.props.navigation.navigate('Onboarding',{ item: this.state })
      } else {
        //Handle error
        let error = res;
        throw error;
      }
    } catch(error) {
       this.setState({error: error});
      console.log("error " + error);
      this.setState({showProgress: false});
    }
  }

  storeToken(responseData){
    AsyncStorage.setItem(ACCESS_TOKEN, responseData, (err)=> {
      if(err){
        console.log("an error");
        throw err;
      }
      console.log("success");
    // console.log(responseData);
    }).catch((err)=> {
      console.log("error is: " + err);
    });
  }





  componentDidMount() {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/userinfo.email', 'profile'],
      webClientId:
        '1075891581077-jfpbqibdak7tp1dvr700q6uiviajfuo0.apps.googleusercontent.com',
      forceConsentPrompt: true
    });
  }

  async saveItem(item, selectedValue) {
    try {
      await AsyncStorage.setItem(item, selectedValue);
    } catch (error) {
      console.error('AsyncStorage error: ' + error.message);
    }
  }

  _toggleGoogleModal = () => {
    this.setState({ googleModalVisible: !this.state.googleModalVisible });
  };

  _toggleFacebookModal = () => {
    this.setState({
      facebookModalVisible: !this.state.facebookModalVisible,
    });
  };

  _togglePasswordVisibility = () => {
    this.setState({ passwordVisible: !this.state.passwordVisible });
  };

  _onGoogleSignupPress = () => {
    this.props.navigation.navigate('Signup', {
      socialSignup: true,
      userInfo: this.state.userInfo,
      method: 'google',
    });
  };

  _onFacebookSignupPress = () => {
    this.props.navigation.navigate('Signup', {
      socialSignup: true,
      userInfo: this.state.userInfo,
      method: 'facebook',
    });
  };

  _onSignupPress = (e) => {
    this.props.navigation.navigate('Signup', {
      socialSignup: false,
      method: 'local',
    });
  }

  _getCurrentUserInfo = async () => {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      console.log('User Info --> ', userInfo);
      this.setState({ userInfo: userInfo });
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        alert('User has not signed in yet');
        console.log('User has not signed in yet');
      } else {
        alert("Something went wrong. Unable to get user's info");
        console.log("Something went wrong. Unable to get user's info");
      }
    }
  };


  _handleGoogleSignin = async () => {

    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const userInfo = await GoogleSignin.signIn();

    googleOauth({ id_token: userInfo.idToken })
      .then(rsp => {
        console.log('oauth successfull : loged in with this jwt');
        console.log(rsp.data.token);
        // save user object and jwt in asyncstorage
        this.saveItem('jwt', rsp.data.token);
        this.props.navigation.navigate('Onboarding',{ item: this.state })





      })
      .catch(err => {
        const user = {
          google_id: userInfo.user.id,
          fullname: userInfo.user.name,
          email: userInfo.user.email,
        };
        this.setState({ userInfo: user });
        this._toggleGoogleModal();
      });

    await GoogleSignin.revokeAccess();
  };

  _handleFacebookSignin = async (error, result) => {

    await LoginManager.logInWithPermissions(['public_profile', 'email']);
    AccessToken.getCurrentAccessToken().then(data => {
      const access_token = data.accessToken.toString();
      facebookOauth({ access_token: access_token })
        .then(rsp => {
          jwt = rsp.data.token;
          // session logic here ***
          // save user object and jwt in asyncstorage
          this.saveItem('jwt', rsp.data.token);
          this.props.navigation.navigate('Onboarding',{ item: this.state })


        })
        .catch(err => {
          getFacebookProfile(access_token)
            .then(rsp => {
              const user = {
                facebook_id: rsp.data.id,
                fullname: rsp.data.name,
                email: rsp.data.email,
              };
              this.setState({ userInfo: user });
            })
            .catch(err => {
              console.log(err);
            });
          this._toggleFacebookModal();
        });
    });

  };

  _onLoginChange = email => {
    this.setState({ email: email });
  };

  _onPasswordChange = password => {
    this.setState({ password: password });
  };

  _onSigninPress = () => {
    this.props.navigation.navigate('Onboarding',{ item: this.state })
    userLogin({
      email: this.state.email,
      password: this.state.password,
    })
      .then(rsp => {
       // console.log(rsp.data.token);
        this.storeToken( rsp.data.token);
        this.props.navigation.navigate('Onboarding',{ item: this.state })



      })
      .catch(err => {
        console.log(err);
      });


  };

  render() {
    return (
      <ScrollView style={styles.container}>
        <SocialSignup
          socialAccount="google"
          isVisible={this.state.googleModalVisible}
          toggleModal={this._toggleGoogleModal}
          proceed={this._onGoogleSignupPress}
        />

        <SocialSignup
          socialAccount="facebook"
          isVisible={this.state.facebookModalVisible}
          toggleModal={this._toggleFacebookModal}
          proceed={this._onFacebookSignupPress}
        />
        <View>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#009299',
              paddingBottom: 10,
            }}
          >
            <Image source={Logo}   style={styles.logo} />
            <Text
              style={[
                styles.text,
                { fontSize: 24, fontWeight: '300', color: '#fff' },
              ]}
            >
              NGI GPS
            </Text>
          </View>

          <View style={{ paddingHorizontal: 25 }}>
            <View
              style={{
                marginTop: 40,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <FacebookSignInButton onPress={this._handleFacebookSignin} />

              <GoogleSigninButton
                style={{ width: 190, height: 58 }}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={this._handleGoogleSignin}
              />
            </View>

            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <View
                style={{
                  borderWidth: StyleSheet.hairlineWidth,
                  height: 0.1,
                  width: 120,
                  borderColor: '#595959',
                  marginTop: 40,
                }}
              />
              <Text
                style={[
                  styles.text,
                  {
                    color: '#595959',
                    fontSize: 18,
                    textAlign: 'center',
                    marginVertical: 25,
                    fontWeight: 'bold',
                  },
                ]}
              >
                or
              </Text>
              <View
                style={{
                  borderWidth: StyleSheet.hairlineWidth,
                  height: 0.1,
                  width: 120,
                  borderColor: '#595959',
                  marginTop: 40,
                }}
              />
            </View>

            <InputTextField
              placeholderText="Email"
              _onTextChange={this._onLoginChange}
            />
            <InputTextField
              _onTextChange={this._onPasswordChange}
              style={{ marginTop: 20, marginBottom: 17 }}
              placeholderText="Password"
              isSecure={this.state.passwordVisible ? false : true}
              isVisible={this.state.passwordVisible ? true : false}
              _toggleVisibility={this._togglePasswordVisibility}
            />

            <Text style={[styles.text, styles.link, { textAlign: 'right' }]}>
              Forgot Password?
            </Text>

            <TouchableOpacity
              style={styles.submitContainer}
              onPress={this._onSigninPress}
            >
              <View>
                <Text
                  style={[
                    styles.text,
                    { color: '#fff', fontWeight: '600', fontSize: 16 },
                  ]}
                >
                  Sign in
                </Text>
              </View>
            </TouchableOpacity>

            <Text
              style={[
                styles.text,
                {
                  fontSize: 14,
                  color: '#ABB4BD',
                  textAlign: 'center',
                  marginTop: 24,
                },
              ]}
            >
              Don't have an account ?
              <Text
                style={[styles.text, styles.link]}
                onPress={e => this._onSignupPress(e)}
              >
                {' '}
                Register Now
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    fontFamily: 'google_sans_bold',
    color: '#1D2029',
  },
  link: {
    color: '#009299',
    fontSize: 14,
    fontWeight: '500',
  },
  submitContainer: {
    backgroundColor: '#009299',
    fontSize: 16,
    borderRadius: 4,
    paddingVertical: 12,
    marginTop: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255, 22, 84, 0.24)',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  logo: {
    width: 183,
    height: 40,
  },
});
