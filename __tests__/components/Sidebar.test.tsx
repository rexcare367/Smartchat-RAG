import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import Sidebar from '@/src/components/Sidebar';

// Mock the MenuItem component
jest.mock('@/src/components/MenuItem', () => {
  return function MockMenuItem({
    title,
    itemList,
    link,
    defaultOpen
  }: {
    title: string;
    itemList: any[];
    link: string;
    defaultOpen: boolean;
  }) {
    return (
      <div>
        <a href={link}>
          <h2>{title}</h2>
        </a>
        <ul>
          {defaultOpen &&
            itemList?.map((item, index) => <li key={index}>{item.label}</li>)}
        </ul>
      </div>
    );
  };
});

// Mock the AIHub component
jest.mock('@/src/components/AIHub', () => {
  return function MockAIHub() {
    return <div>AI Hub</div>;
  };
});

const mockSetIsSidebarOpen = jest.fn();

const mockNamespacesList = [
  { label: 'Namespace 1', value: 'ns1' },
  { label: 'Namespace 2', value: 'ns2' }
];

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: '1', title: 'Test Chat' }])
      })
    ) as jest.Mock;
  });

  it('renders Sidebar component with all expected elements', async () => {
    await act(async () => {
      render(
        <Sidebar
          setIsSidebarOpen={mockSetIsSidebarOpen}
          namespacesList={mockNamespacesList}
        />
      );
    });

    expect(screen.getByText('Embed RAG File')).toBeInTheDocument();
    expect(screen.getByText('Finetune AI Model')).toBeInTheDocument();
    expect(screen.getByText('Chat With AI')).toBeInTheDocument();
    expect(screen.getByText('AI Hub')).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Fetch failed'))
    ) as jest.Mock;

    await act(async () => {
      render(
        <Sidebar
          setIsSidebarOpen={mockSetIsSidebarOpen}
          namespacesList={mockNamespacesList}
        />
      );
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch chats: Fetch failed'
      );
    });

    consoleSpy.mockRestore();
  });

  it('fetches chats on mount', async () => {
    await act(async () => {
      render(
        <Sidebar
          setIsSidebarOpen={mockSetIsSidebarOpen}
          namespacesList={mockNamespacesList}
        />
      );
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/chats');

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });
  });

  it('renders namespaces list correctly', async () => {
    await act(async () => {
      render(
        <Sidebar
          setIsSidebarOpen={mockSetIsSidebarOpen}
          namespacesList={mockNamespacesList}
        />
      );
    });

    expect(screen.queryByText('Namespace 1')).toBeNull(); // Not visible because Embed RAG File is not defaultOpen
    expect(screen.queryByText('Namespace 2')).toBeNull();
  });

  it('initially renders child menu items correctly based on defaultOpen state', async () => {
    await act(async () => {
      render(
        <Sidebar
          setIsSidebarOpen={mockSetIsSidebarOpen}
          namespacesList={mockNamespacesList}
        />
      );
    });

    expect(screen.queryByText('File 1')).toBeNull();
    expect(screen.queryByText('Model1')).toBeNull();

    // Wait for the chat data to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    }); // Visible because defaultOpen is true for Chat With AI
  });

  it('has the correct href for Each MenuItem', async () => {
    await act(async () => {
      render(
        <Sidebar
          setIsSidebarOpen={mockSetIsSidebarOpen}
          namespacesList={mockNamespacesList}
        />
      );
    });

    const embedRagFileLink = screen.getByText('Embed RAG File').closest('a');
    expect(embedRagFileLink).toHaveAttribute('href', '/embedragfile');

    const finetuneModelLink = screen
      .getByText('Finetune AI Model')
      .closest('a');
    expect(finetuneModelLink).toHaveAttribute('href', '/finetunemodel');

    const chatWithAILink = screen.getByText('Chat With AI').closest('a');
    expect(chatWithAILink).toHaveAttribute('href', '/');
  });

  it('matches snapshot', async () => {
    let asFragment: (() => DocumentFragment) | undefined;

    await act(async () => {
      const result = render(
        <Sidebar
          setIsSidebarOpen={mockSetIsSidebarOpen}
          namespacesList={mockNamespacesList}
        />
      );
      asFragment = result.asFragment;
    });

    if (asFragment) {
      expect(asFragment()).toMatchSnapshot();
    } else {
      throw new Error('asFragment was not assigned');
    }
  });
});
