import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
          gap: '12px',
        }}>
          <div style={{ fontSize: '13px', color: '#c94040', fontFamily: 'IBM Plex Mono, monospace' }}>
            Something went wrong
          </div>
          <div style={{ fontSize: '12px', color: '#888580', maxWidth: '480px', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: '8px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#e05c3a',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
