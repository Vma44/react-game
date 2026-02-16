#include <iostream>
#include <deque>
 using namespace std;

int main()
{
    deque <int> q;
    q.push_back(15);
    q.push_back(11);
    q.push_back(13);
    for(int i = 0; i < q.size(); i++)
        {
            cout << q.front() << '\n';
        }
    cout << q.front();
}
