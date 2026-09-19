import {Component, type ErrorInfo, type ReactNode} from 'react';

type Props={children:ReactNode};
type State={error:string|null};

export class LabErrorBoundary extends Component<Props,State>{
  state:State={error:null};

  static getDerivedStateFromError(error:unknown):State{
    return {error:error instanceof Error?error.message:String(error)};
  }

  componentDidCatch(error:unknown,info:ErrorInfo){
    console.error('MCF Video Lab preview error',error,info.componentStack);
  }

  render(){
    if(this.state.error){
      return <div className="lab-preview-error">
        <strong>Preview indisponível</strong>
        <span>{this.state.error}</span>
      </div>;
    }
    return this.props.children;
  }
}
