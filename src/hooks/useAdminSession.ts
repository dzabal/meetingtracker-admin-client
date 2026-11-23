import {useCallback,useState} from 'react';
export function useAdminSession(){const [adminKey,setAdminKey]=useState<string|null>(null);const [operator,setOperator]=useState('');const logout=useCallback(()=>{setAdminKey(null);setOperator('')},[]);return {adminKey,operator,setAdminKey,setOperator,logout};}
