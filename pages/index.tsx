import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import {gql} from 'graphql-tag'
import {useQuery, useMutation} from '@apollo/client'
import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'

const loginSchema = Yup.object().shape({
  email: Yup.string().email()
  .required('Required'),
  password: Yup.string()
  .required('Required'),

})

const setPasswordSchema = Yup.object().shape({
  oldPassword: Yup.string().required('Old password is required'),
  newPassword: Yup.string().required('New password is required'),
  confirmNewPassword: Yup.string()
     .oneOf([Yup.ref('newPassword'), null], 'Passwords must match').required('Passwords must match')

})

const CURRENT_USER_QUERY = gql`
query {
  events {
    note
  }
}
`

const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!){
    authenticateUserWithPassword(email: $email, password: $password){
      ...on UserAuthenticationWithPasswordSuccess{
        item {
          email,
          id,
          lastPasswordUpdate
        }
      }
    }
  }
`

const RESET_PASSWORD_MUTATION = gql`
  mutation RESET_PASSWORD_MUTATION ($email: String! $newPassword: String!, $time: DateTime!) {
    updateUser( where:{
      email: $email
    }, data:{
      password: $newPassword
      lastPasswordUpdate: $time
    }) {
      email
      lastPasswordUpdate
    }
  }
`

//@ts-ignore
const Header = ({children}) => (
  <div className={styles.header}>{children}</div>
)


const Home: NextPage = () => {
  const query = useQuery(CURRENT_USER_QUERY)

  const setPassword = useFormik({
    initialValues:{
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    },
    onSubmit: values => changePassword(values),
    validationSchema: setPasswordSchema
  })

  const formik = useFormik({
    initialValues:{
      email: '',
      password: ''
    },
    onSubmit: values => login(values),
    validationSchema: loginSchema
  })
   const [user, setUser] = useState()
   const [formError, setError] = useState('')

  const [signin, { data, error, loading}] = useMutation(SIGNIN_MUTATION, {
    variables:{
      email: formik.values.email,
      password: formik.values.password
    }
  })

  const [updatePassword, updatePasswordData] = useMutation(RESET_PASSWORD_MUTATION,{
    variables:{
      newPassword: setPassword.values.newPassword,
      email: user?.email,
      time: new Date().toISOString(),
    }
  })
  
  type LoginValues = {
    email: string
    password: string
  }
  
  type ChangePasswordValues = {
    oldPassword: string
    newPassword: string
  }

  const login = async (values:LoginValues) => {  
    try {
      const {data: {authenticateUserWithPassword: {item}}} = await signin()
      if (item) {
        setUser(item)
      } 
      if(data && !item) {
        setError('Something went wrong while login in, please be sure the email and password is right.')
      }
    } catch (error){}
  }
  
  const changePassword = async (values:ChangePasswordValues) => {
    try {
      const {data:{updateUser: {lastPasswordUpdate}}} = await updatePassword()
      if (lastPasswordUpdate) {
        setUser({
          ...user,
          lastPasswordUpdate
        })
      }
    } catch (error){
      console.log('error >> ', error.message)
      setError('Something went wrong while login in, please be sure the email and password is right.')
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Altozano Tabasco - Asociación de vecinos Cumbres 7</title>
        <meta name="description" content="Cumbres 7 Altozano Tabasco" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header>
        <div className={styles.titleDiv}>
          <h1>Asociación de colonos de Cumbres 7</h1>
          <h4>Villahermosa Tabasco</h4>
        </div>
        <img src={'/images/logo.png'} className={styles.logo} />
      </Header>

      <main className={styles.main}>
            {user?.lastPasswordUpdate && <iframe allowFullScreen height="100vh" width="100%" className={styles.iframe} src="https://docs.google.com/spreadsheets/d/e/2PACX-1vQnhCiDNliaGXEIXO3FFyWgZ0nLFeiaAp77ASDVZjQML8CzZTXsdhdgKyMxUyImmPAoRnirPWQxFY7K/pubhtml?widget=true&amp;headers=true"></iframe>}
        <div>
          <div>
          </div>
          <div>
            {user && !user?.lastPasswordUpdate && <>
            <h2>Por favor actualiza tu password por primera ves, de esta manera solo tu la tendras...</h2>
            
                <form method='POST' onSubmit={setPassword.handleSubmit}>
                  <input name='oldPassword' autoComplete='password' onChange={setPassword.handleChange} value={setPassword.values?.oldPassword} type="password" placeholder='Password anterior' />
                  {setPassword.errors.oldPassword && <span className={styles.error}>{setPassword.errors.oldPassword}</span>}
                  <input name='newPassword' autoComplete='password' onChange={setPassword.handleChange} value={setPassword.values?.newPassword} type="password" placeholder='Password Nuevo' />
                  {setPassword.errors.newPassword && <span className={styles.error}>{setPassword.errors.newPassword}</span>}
                  <input name='confirmNewPassword' autoComplete='password' onChange={setPassword.handleChange} value={setPassword.values?.confirmNewPassword} type="password" placeholder='Confirma tu password nuevo' />
                  {setPassword.errors.confirmNewPassword && <span className={styles.error}>{setPassword.errors.confirmNewPassword}</span>}
                  <input type="submit" name={loading? 'Loading...' : 'Log in'} />
                  {formError && <span className={styles.error}>{formError}</span>}
                </form>
            
            </>}
            {!user && <>
            <h2>Log in into Cumbres 7 dashboard</h2>
            
                <form method='POST' onSubmit={formik.handleSubmit}>
                  <input name='email' autoComplete='email' onChange={formik.handleChange} value={formik.values?.email} type="text" placeholder='Email' />
                  {formik.errors.email && <span className={styles.error}>{formik.errors.email}</span>}
                  <input name='password' autoComplete='password' onChange={formik.handleChange} value={formik.values?.password} type="password" placeholder='Password' />
                  {formik.errors.password && <span className={styles.error}>{formik.errors.password}</span>}
                  <input type="submit" name={loading? 'Loading...' : 'Log in'} />
                  {formError && <span className={styles.error}>{formError}</span>}
                </form>
            
            </>}
          </div>
        </div>
        
      </main>

      <footer className={styles.footer}>
        <a
          href="https://cyberpolin.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by cyberpolin.com
          
        </a>
      </footer>
    </div>
  )
}

export default Home
