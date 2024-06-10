import {useState, useRef, useCallback, useEffect, ChangeEvent,FormEvent, FC } from 'react'
import {GetStaticProps} from 'next'
import { RiScreenshot2Fill } from "react-icons/ri";//screenshot

import { modelOptions } from '@/config/modellist'
import ArrowButton  from '@/src/components/ArrowButton'
import ChatMessage from '@/src/components/ChatMessage'
import DropdownSelect from '@/src/components/DropdownSelect'
import ImageListWithModal from '@/src/components/ImageListWithModal'
import ImageUploadIcon from '@/src/components/ImageUploadIcon'
import Notification from '@/src/components/Notification'
import { Message } from '@/src/types/chat'
import { OptionType } from '@/src/types/common'
import { fetchData } from '@/src/utils/fetchData'
import {fileToBase64, fetchImageAsBase64 } from '@/src/utils/fileFetchAndConversion'


const initialFileCategory: OptionType = {value: 'none', label: 'None'}

const initialMessage = {
  question: '', 
  answer:'Hi, how can I assist you?'
}

const HomePage : FC<{
  namespaces: string[]
  isNewChat: boolean, 
  setIsNewChat: (value: boolean) => void, 
}> = ({ namespaces, isNewChat, setIsNewChat}) => {

  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const messagesRef = useRef<HTMLDivElement | null> (null)

  const fileCategoryOptions = namespaces === null ?[ initialFileCategory]: [ initialFileCategory, ...namespaces.map(ns => ({ value: ns, label: ns}))];
  const [selectedNamespace, setSelectedNamespace] = useState<OptionType | null>( initialFileCategory)

  const [selectedModel, setSelectedModel] = useState<OptionType | null>(modelOptions[0])
  const [basePrompt, setBasePrompt] = useState('')

  const [userInput, setUserInput] = useState<string>('')
  const [rows, setRows] = useState<number>(1)
  const [chatHistory, setChatHistory] = useState<Message[]>([ initialMessage ])

  const [imageSrc, setImageSrc] = useState<string[]>([])
  const [imageSrcHistory, setImageSrcHistory] = useState<string[][]>([[]])

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const isVisionModel = selectedModel?.value==="gpt-4o" ||
  selectedModel?.value==="gpt-4-turbo" ||
  selectedModel?.value==="gemini-1.5-flash" ||
  selectedModel?.value!=="gemini-1.5-pro"
  
  const fetchChatResponse = async (basePrompt:string, question: string, imageSrc: string[], selectedModel: OptionType | null, namespace: string) => {
 
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basePrompt,
          question,
          imageSrc,
          chatHistory,
          namespace,
          selectedModel
        }),
      })

      //handling server-side errors
      if (!response.ok) {
        const errorData = await response.json()

        setError("There is a server side error. Try it again later.")
        setLoading(false)
        return
      }

      const data = await response.json()

      setChatHistory([...chatHistory.slice(0, chatHistory.length), {question: userInput, answer: data.answer}])

      setLoading(false)

    } catch (error) {
      setLoading(false)
      setError('An error occurred while fetching the data. Please try again.')
      console.error('error', error)
    }
  }

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const question : string = userInput.trim()
    // prevent form submission if nothing is entered
    if(question.length === 0 && imageSrc.length === 0) return

    setImageSrcHistory([...imageSrcHistory, imageSrc])
    
    setChatHistory([...chatHistory.slice(0, chatHistory.length), {question: userInput, answer: ''}])
   
    setError(null)
    setLoading(true)
    setUserInput('')
    setImageSrc([])
    setRows(1) // Reset the textarea rows to initial state

    fetchChatResponse(basePrompt, question, imageSrc, selectedModel, selectedNamespace?.value || 'none')
  }, [userInput, imageSrc, fetchChatResponse])

  const handleModelChange = (selectedOption: OptionType | null) => {
    setSelectedModel(selectedOption)
  }

  const handleNamespaceChange = (selectedOption: OptionType | null) => {
    setSelectedNamespace(selectedOption)
  }

  const handleBasePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const basePrompt= e.target.value
    setBasePrompt(basePrompt)
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setUserInput(newValue)
    const newRows = newValue.match(/\n/g)?.length ?? 0
    setRows(newRows + 1)
  }

  const handleImageUpload =async (file: File) => {
    if(!isVisionModel) return;
    if (!file) return;
    try{
      const newImage = await fileToBase64(file)
      setImageSrc([...imageSrc, newImage])
    } catch {
      throw new Error('Failed to read the file.')
    }       
  }

  const handleImageDelete = (id: number) =>{
    setImageSrc([...imageSrc.slice(0, id), ...imageSrc.slice(id+1)])
  }

  const handleScreenCapture = async () => {
    try {
      const response = await fetch('/api/screenshot', { method: 'POST' })
      const result = await response.json();
      if (response.ok) {
        const newImage = await fetchImageAsBase64(result.imgPath)
        setImageSrc([...imageSrc, newImage])
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while capturing the screen')
    }
  }

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()

      //insert newline \n when using shift + enter
      if ( e.shiftKey) {       
        setUserInput(prevState => prevState + "\n")
        setRows(rows => rows + 1)

      } else {
        handleSubmit(e as any)
        setRows(1)
      }
    }
    const currentTextArea = textAreaRef.current
    if (currentTextArea) {
      currentTextArea.addEventListener('keydown', keyDownHandler)
      currentTextArea.scrollTop = currentTextArea.scrollHeight
    }
  
    return () => {
      if (currentTextArea) {
        currentTextArea.removeEventListener('keydown', keyDownHandler)
      }
    }
  
  }, [handleSubmit])

  useEffect(() => {
    if(messagesRef.current !== null) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [chatHistory])

  useEffect(() => {
    if (isNewChat) {
      setChatHistory([initialMessage])
      setIsNewChat(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps    
  }, [isNewChat])

  return  (
    <div className="flex flex-col px-2 items-center justify-center mx-auto">
      <div className="flex flex-col  items-center justify-center w-full">
      <div className="flex flex-col sm:flex-row w-full justify-around">
        <DropdownSelect 
          selectedOption={selectedModel} 
          onChange={handleModelChange}
          options={modelOptions}
          label='Choose AI Model:'
        />
        <DropdownSelect 
          selectedOption={selectedNamespace} 
          onChange={handleNamespaceChange}
          options={fileCategoryOptions}
          label='Using Saved File:'
        />
      </div>      
      <div  className="flex flex-col w-full items-center py-2"
      >
        <label htmlFor="userSystemPrompt" className="text-base font-bold">Enter text here for AI to remember throughout the chat:</label>
        <textarea
          id="userSystemPrompt"
          rows={2} 
          name='userSystemPrompt'
          onChange={handleBasePromptChange}
          value={basePrompt}
          className={`w-full placeholder-gray-400 my-2 p-2 border-2 border-indigo-300 rounded focus:ring-stone-100 focus:outline-none hover:bg-stone-50`}
          aria-label="Enter text here for AI to remember throughout the chat"
        />   
      </div>      
      <div className="flex flex-col w-full h-60vh items-center">
        <div className={`w-full grow bg-white border-2 border-stone-200 overflow-y-auto`}>
          <div  
            className="w-full h-full overflow-y-scroll rounded-lg"
            aria-live="polite"
            aria-atomic="true"
            ref={messagesRef}
          >
            {chatHistory.map((chat, index) => 
               <div key={index}>                
               <ChatMessage
               index={index}
               message={chat}
               lastIndex={index===chatHistory.length-1?true:false}
               loading={loading}
               imageSrc={imageSrcHistory[index]}
               modelName={selectedModel?.value||'gpt-4o'}
               handleImageDelete={handleImageDelete}
             />
            
             
              </div>
              )
            }
          </div>
        </div>
        <ImageListWithModal
          imageSrc={imageSrc}
          handleImageDelete={handleImageDelete}
          isDeleteIconShow={true}
        />
        <div className="flex w-full justify-around items-center mx-2 my-1 border-2 border-indigo-300 bg-indigo-200 bg-opacity-30 rounded-lg ">
          <div className="flex w-3/12 ms-2/12 xs:w-1/12  items-center justify-around mx-1">
            <div className="screen-capture">
              <button 
                onClick={handleScreenCapture} 
                className="flex items-center justify-center font-bold px-1 rounded cursor-pointer disabled:cursor-not-allowed"
                aria-label="Capture Screenshot"
                disabled={!isVisionModel}
              >
                <RiScreenshot2Fill size={30} />
              </button>
              <span 
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 hidden group-hover:block bg-gray-100 text-black text-xs rounded py-1 px-5 whitespace-nowrap">
                { isVisionModel? 
                  `Capture Screenshot`
                  :  `${selectedModel?.value} does not have vision feature `}
              </span>
            </div>
            <div className="image-upload">
            <ImageUploadIcon 
              onImageUpload={handleImageUpload}
              aria-label="Upload Image"
            />
             <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-6 hidden group-hover:block bg-gray-100 text-black text-xs rounded py-1 px-5 whitespace-nowrap">
              { isVisionModel ? 
                'Upload Image'
                : `${selectedModel?.value} does not have vision feature` }
            </span>
            </div>   
          </div>    
          <form
            onSubmit={handleSubmit} 
            className="flex items-center w-8/12 ms:w-9/12 xs:w-10/12 xl:w-11/12 px-2 py-1 rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring focus:ring-stone-300 focus:ring-offset-red"
          >          
            <textarea
              ref={textAreaRef}
              disabled={loading}
              autoFocus={false}
              rows={rows}
              id="userInput"
              name="userInput"
              className={`w-full max-h-96 placeholder-gray-400 overflow-y-auto focus: p-3 ${loading && 'opacity-50'} focus:ring-stone-100 focus:outline-none`}
              placeholder="Click to send. Shift + Enter for a new line."
              value={userInput}
              onChange={handleInputChange}
              aria-label="Enter your message here"
            />         
            <ArrowButton 
              disabled={userInput==='' && imageSrc.length === 0}
              aria-label="Send" 
            />
          </form>
        </div>
        { error && <Notification type="error" message={error} /> }      
        </div>
      </div>       
    </div>    
  )  
}
export default HomePage

export const getStaticProps: GetStaticProps = async () => {

  const response = await fetchData('namespaces')
  const namespaces = response?.namespaces || null // default to null if undefined

  return {
    props: {
      namespaces
    },
    revalidate: 60 * 60 * 24 // Regenerate the page after every 24 hours
  }
}