import { startWs, stopWs } from "@/ws/wsClient"
import { Button } from "../components/ui/button"

export function WsDebug() {
    return (<>
        <Button
            onClick={async () => {
                try {
                    startWs()
                    console.log("连接成功")
                } catch {
                    alert("连接失败")
                }
            }}
        >
            连接
        </Button>
        <br></br>
        <Button onClick={() => stopWs()}>
            断开
        </Button>
    </>)
}



