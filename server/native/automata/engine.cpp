#include <algorithm>
#include <fstream>
#include <iostream>
#include <map>
#include <queue>
#include <set>
#include <sstream>
#include <string>
#include <vector>

struct State {
    int id;
    bool isStart;
    bool isFinal;
};

struct Transition {
    int from;
    int to;
    std::string symbol; // "a", "b", or "ε"
};

struct Automaton {
    std::vector<State> states;
    std::vector<Transition> transitions;
};

static const std::string EPSILON = "ε";

static std::string readAllStdin() {
    std::ostringstream ss;
    ss << std::cin.rdbuf();
    return ss.str();
}

static bool parseBoolAt(const std::string& src, size_t& pos, const std::string& key) {
    size_t k = src.find(key, pos);
    if (k == std::string::npos) return false;
    size_t c = src.find(':', k);
    if (c == std::string::npos) return false;
    size_t t = src.find_first_not_of(" \t\r\n", c + 1);
    if (t == std::string::npos) return false;
    bool value = src.compare(t, 4, "true") == 0;
    pos = t;
    return value;
}

static int parseIntAfter(const std::string& src, size_t& pos, const std::string& key) {
    size_t k = src.find(key, pos);
    if (k == std::string::npos) return 0;
    size_t c = src.find(':', k);
    if (c == std::string::npos) return 0;
    size_t t = src.find_first_of("-0123456789", c + 1);
    if (t == std::string::npos) return 0;
    size_t e = t + 1;
    while (e < src.size() && std::isdigit(static_cast<unsigned char>(src[e]))) e++;
    pos = e;
    return std::stoi(src.substr(t, e - t));
}

static std::string parseStringAfter(const std::string& src, size_t& pos, const std::string& key) {
    size_t k = src.find(key, pos);
    if (k == std::string::npos) return "";
    size_t c = src.find(':', k);
    if (c == std::string::npos) return "";
    size_t q1 = src.find('"', c + 1);
    if (q1 == std::string::npos) return "";
    size_t q2 = src.find('"', q1 + 1);
    if (q2 == std::string::npos) return "";
    pos = q2 + 1;
    return src.substr(q1 + 1, q2 - q1 - 1);
}

static std::vector<State> parseStates(const std::string& src) {
    std::vector<State> states;
    size_t statesKey = src.find("\"states\"");
    if (statesKey == std::string::npos) return states;
    size_t arrStart = src.find('[', statesKey);
    size_t arrEnd = src.find(']', arrStart);
    if (arrStart == std::string::npos || arrEnd == std::string::npos) return states;
    std::string block = src.substr(arrStart, arrEnd - arrStart + 1);

    size_t pos = 0;
    while (true) {
        size_t objStart = block.find('{', pos);
        if (objStart == std::string::npos) break;
        size_t objEnd = block.find('}', objStart);
        if (objEnd == std::string::npos) break;
        std::string obj = block.substr(objStart, objEnd - objStart + 1);
        size_t p = 0;
        State s{};
        s.id = parseIntAfter(obj, p, "\"id\"");
        p = 0;
        s.isStart = parseBoolAt(obj, p, "\"isStart\"");
        p = 0;
        s.isFinal = parseBoolAt(obj, p, "\"isFinal\"");
        states.push_back(s);
        pos = objEnd + 1;
    }
    return states;
}

static std::vector<Transition> parseTransitions(const std::string& src) {
    std::vector<Transition> transitions;
    size_t key = src.find("\"transitions\"");
    if (key == std::string::npos) return transitions;
    size_t arrStart = src.find('[', key);
    size_t arrEnd = src.find(']', arrStart);
    if (arrStart == std::string::npos || arrEnd == std::string::npos) return transitions;
    std::string block = src.substr(arrStart, arrEnd - arrStart + 1);

    size_t pos = 0;
    while (true) {
        size_t objStart = block.find('{', pos);
        if (objStart == std::string::npos) break;
        size_t objEnd = block.find('}', objStart);
        if (objEnd == std::string::npos) break;
        std::string obj = block.substr(objStart, objEnd - objStart + 1);
        size_t p = 0;
        Transition t{};
        t.from = parseIntAfter(obj, p, "\"from\"");
        p = 0;
        t.to = parseIntAfter(obj, p, "\"to\"");
        p = 0;
        t.symbol = parseStringAfter(obj, p, "\"symbol\"");
        transitions.push_back(t);
        pos = objEnd + 1;
    }
    return transitions;
}

static std::string parseMode(const std::string& src) {
    size_t p = 0;
    std::string mode = parseStringAfter(src, p, "\"mode\"");
    if (mode.empty()) return "NFA";
    return mode;
}

static std::string parseInput(const std::string& src) {
    size_t p = 0;
    return parseStringAfter(src, p, "\"input\"");
}

static std::string parseAction(const std::string& src) {
    size_t p = 0;
    std::string action = parseStringAfter(src, p, "\"action\"");
    if (action.empty()) return "simulate";
    return action;
}

static std::set<int> epsilonClosure(const Automaton& automaton, const std::set<int>& states) {
    std::set<int> closure = states;
    std::queue<int> q;
    for (int state : states) q.push(state);

    while (!q.empty()) {
        int current = q.front();
        q.pop();
        for (const auto& t : automaton.transitions) {
            if (t.from == current && t.symbol == EPSILON && !closure.count(t.to)) {
                closure.insert(t.to);
                q.push(t.to);
            }
        }
    }
    return closure;
}

static std::set<int> moveSet(const Automaton& automaton, const std::set<int>& states, const std::string& symbol) {
    std::set<int> result;
    for (int state : states) {
        for (const auto& t : automaton.transitions) {
            if (t.from == state && t.symbol == symbol) result.insert(t.to);
        }
    }
    return result;
}

static std::set<std::string> collectSymbols(const Automaton& automaton) {
    std::set<std::string> symbols;
    for (const auto& t : automaton.transitions) {
        if (t.symbol != EPSILON) symbols.insert(t.symbol);
    }
    return symbols;
}

static bool containsFinal(const Automaton& automaton, const std::set<int>& subset) {
    for (const auto& s : automaton.states) {
        if (s.isFinal && subset.count(s.id)) return true;
    }
    return false;
}

static int getStartStateId(const Automaton& automaton) {
    for (const auto& s : automaton.states) {
        if (s.isStart) return s.id;
    }
    return automaton.states.empty() ? 0 : automaton.states.front().id;
}

static std::string keyForSet(const std::set<int>& subset) {
    std::ostringstream ss;
    bool first = true;
    for (int s : subset) {
        if (!first) ss << ",";
        ss << s;
        first = false;
    }
    return ss.str();
}

static Automaton convertToDFA(const Automaton& nfa) {
    Automaton dfa;
    std::set<std::string> symbols = collectSymbols(nfa);
    std::map<std::string, int> subsetToId;
    std::map<int, std::set<int>> idToSubset;
    std::queue<std::set<int>> work;

    std::set<int> startSet = {getStartStateId(nfa)};
    startSet = epsilonClosure(nfa, startSet);
    subsetToId[keyForSet(startSet)] = 0;
    idToSubset[0] = startSet;
    work.push(startSet);
    dfa.states.push_back({0, true, containsFinal(nfa, startSet)});

    int nextId = 1;
    while (!work.empty()) {
        std::set<int> current = work.front();
        work.pop();
        int fromId = subsetToId[keyForSet(current)];

        for (const auto& symbol : symbols) {
            std::set<int> moved = moveSet(nfa, current, symbol);
            if (moved.empty()) continue;
            std::set<int> next = epsilonClosure(nfa, moved);
            std::string key = keyForSet(next);
            if (!subsetToId.count(key)) {
                subsetToId[key] = nextId;
                idToSubset[nextId] = next;
                dfa.states.push_back({nextId, false, containsFinal(nfa, next)});
                work.push(next);
                nextId++;
            }
            dfa.transitions.push_back({fromId, subsetToId[key], symbol});
        }
    }
    return dfa;
}

static std::vector<std::vector<int>> tracePathNFA(const Automaton& automaton, const std::string& input) {
    std::vector<std::vector<int>> trace;
    std::set<int> active = {getStartStateId(automaton)};
    active = epsilonClosure(automaton, active);
    trace.emplace_back(active.begin(), active.end());

    for (char ch : input) {
        std::string symbol(1, ch);
        std::set<int> moved = moveSet(automaton, active, symbol);
        active = epsilonClosure(automaton, moved);
        trace.emplace_back(active.begin(), active.end());
    }
    return trace;
}

static std::vector<std::vector<int>> tracePathDFA(const Automaton& automaton, const std::string& input) {
    std::vector<std::vector<int>> trace;
    int current = getStartStateId(automaton);
    trace.push_back({current});

    for (char ch : input) {
        std::string symbol(1, ch);
        bool advanced = false;
        for (const auto& t : automaton.transitions) {
            if (t.from == current && t.symbol == symbol) {
                current = t.to;
                trace.push_back({current});
                advanced = true;
                break;
            }
        }
        if (!advanced) {
            trace.push_back({});
            break;
        }
    }
    return trace;
}

static std::string jsonEscape(const std::string& s) {
    std::string out;
    for (char ch : s) {
        if (ch == '"' || ch == '\\') out.push_back('\\');
        out.push_back(ch);
    }
    return out;
}

static void printAutomatonJson(const Automaton& a) {
    std::cout << "{\"states\":[";
    for (size_t i = 0; i < a.states.size(); i++) {
        const auto& s = a.states[i];
        if (i) std::cout << ",";
        std::cout << "{\"id\":" << s.id
                  << ",\"isStart\":" << (s.isStart ? "true" : "false")
                  << ",\"isFinal\":" << (s.isFinal ? "true" : "false") << "}";
    }
    std::cout << "],\"transitions\":[";
    for (size_t i = 0; i < a.transitions.size(); i++) {
        const auto& t = a.transitions[i];
        if (i) std::cout << ",";
        std::cout << "{\"from\":" << t.from
                  << ",\"to\":" << t.to
                  << ",\"symbol\":\"" << jsonEscape(t.symbol) << "\"}";
    }
    std::cout << "]";
}

static void printTrace(const std::vector<std::vector<int>>& trace) {
    std::cout << ",\"trace\":[";
    for (size_t i = 0; i < trace.size(); i++) {
        if (i) std::cout << ",";
        std::cout << "[";
        for (size_t j = 0; j < trace[i].size(); j++) {
            if (j) std::cout << ",";
            std::cout << trace[i][j];
        }
        std::cout << "]";
    }
    std::cout << "]";
}

int main() {
    std::string payload = readAllStdin();
    Automaton automaton;
    automaton.states = parseStates(payload);
    automaton.transitions = parseTransitions(payload);
    std::string mode = parseMode(payload);
    std::string input = parseInput(payload);
    std::string action = parseAction(payload);

    if (automaton.states.empty()) {
        std::cout << "{\"error\":\"Automaton states are required.\"}";
        return 1;
    }

    bool nfaMode = mode == "NFA" || mode == "nfa";
    Automaton target = automaton;
    if (action == "convert" || (action == "simulate" && nfaMode)) {
        if (action == "convert") {
            target = convertToDFA(automaton);
            std::cout << "{";
            printAutomatonJson(target);
            std::cout << "}";
            return 0;
        }
    }

    std::vector<std::vector<int>> trace;
    if (nfaMode) trace = tracePathNFA(automaton, input);
    else trace = tracePathDFA(automaton, input);

    std::cout << "{";
    printAutomatonJson(automaton);
    printTrace(trace);
    std::cout << "}";
    return 0;
}
