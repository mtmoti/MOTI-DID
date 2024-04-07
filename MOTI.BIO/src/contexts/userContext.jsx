import { createContext, useEffect, useState } from "react"
import magic from "../components/modals/magic/magic"

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        magic.user.isLoggedIn().then((result) => {
            setIsLoggedIn(result)
            setIsLoading(false)
        }).catch((err) => {
            console.log(err)
            setIsLoggedIn(false)
            setIsLoading(false)
        })
    }, [isLoggedIn])

    return (
        <UserContext.Provider value={{ isLoggedIn, setIsLoggedIn, isLoading }}>
            {children}
        </UserContext.Provider>
    )
}